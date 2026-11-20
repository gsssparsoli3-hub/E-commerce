import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { json, badRequest, serverError, unauthorized } from "@/lib/api-helpers";

/**
 * POST /api/payments/razorpay/webhook
 * Razorpay webhook receiver — the safety net for payments where the customer
 * closes the browser before the client-side /verify call runs (money captured,
 * order stuck PENDING). The webhook secret is configured by the admin in site
 * settings; the `x-razorpay-signature` header is an HMAC SHA256 of the RAW
 * request body. No session required — the signature IS the auth.
 *
 * Contract: always answer 200 for a valid signature (Razorpay retries non-200
 * responses aggressively). 401 only for missing secret / bad signature,
 * 400 for an unparseable body. Handlers are idempotent — duplicate deliveries
 * (or races with the /verify route) are acknowledged and skipped.
 */

// Minimal typing for the parts of the Razorpay event payload we act on.
interface RazorpayWebhookEvent {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string; error_description?: string } };
    refund?: { entity?: { id?: string; payment_id?: string } };
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Grab the RAW body FIRST — the signature is computed over these exact bytes,
    //    so it must not be re-serialized from a parsed object.
    const rawBody = await req.text();

    // 2. Verify the signature before trusting anything in the payload.
    const settings = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    const secret = settings?.razorpayWebhookSecret;
    if (!secret) return unauthorized("Razorpay webhook is not configured");

    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    // timingSafeEqual throws on length mismatch, so compare lengths first.
    const signatureBuf = Buffer.from(signature, "utf-8");
    const expectedBuf = Buffer.from(expected, "utf-8");
    const signatureValid =
      signatureBuf.length === expectedBuf.length && crypto.timingSafeEqual(signatureBuf, expectedBuf);

    if (!signatureValid) return unauthorized("Invalid webhook signature");

    // 3. Signature is valid — now parse the payload.
    let event: RazorpayWebhookEvent;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return badRequest("Unparseable webhook payload");
    }

    const payment = event.payload?.payment?.entity;

    switch (event.event) {
      case "payment.captured": {
        const order = payment?.order_id
          ? await db.order.findFirst({ where: { razorpayOrderId: payment.order_id } })
          : null;
        if (!order) break; // Unknown order — ack and ignore

        // Idempotency: /verify may have won the race, or this is a retry.
        if (order.paymentStatus === "PAID") break;

        const shouldConfirm = order.status === "PLACED";
        await db.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            paymentId: payment?.id ?? order.paymentId,
            status: shouldConfirm ? "CONFIRMED" : order.status,
            confirmedAt: shouldConfirm ? new Date() : order.confirmedAt,
          },
        });
        await db.orderEvent.createMany({
          data: [
            { orderId: order.id, type: "PAYMENT", value: "PAID", note: `Razorpay webhook confirmed payment (ID: ${payment?.id ?? "unknown"})`, createdBy: "razorpay-webhook" },
            ...(shouldConfirm
              ? [{ orderId: order.id, type: "STATUS", value: "CONFIRMED", note: "Auto-confirmed via webhook", createdBy: "razorpay-webhook" }]
              : []),
          ],
        });
        console.log(`[razorpay-webhook] payment.captured → order ${order.orderNumber} marked PAID`);
        break;
      }

      case "payment.failed": {
        const order = payment?.order_id
          ? await db.order.findFirst({ where: { razorpayOrderId: payment.order_id } })
          : null;
        if (!order || order.paymentStatus !== "PENDING") break; // Idempotent: only flip PENDING → FAILED

        const reason = payment?.error_description ? ` — ${payment.error_description}` : "";
        await db.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED" },
        });
        await db.orderEvent.create({
          data: {
            orderId: order.id,
            type: "PAYMENT",
            value: "FAILED",
            note: `Razorpay webhook reported payment failed (ID: ${payment?.id ?? "unknown"})${reason}`,
            createdBy: "razorpay-webhook",
          },
        });
        console.log(`[razorpay-webhook] payment.failed → order ${order.orderNumber} marked FAILED`);
        break;
      }

      case "refund.processed": {
        // Prefer the order id on the payment entity; fall back to the refunded payment id.
        const refund = event.payload?.refund?.entity;
        const order =
          (payment?.order_id
            ? await db.order.findFirst({ where: { razorpayOrderId: payment.order_id } })
            : null) ??
          (refund?.payment_id ? await db.order.findFirst({ where: { paymentId: refund.payment_id } }) : null);
        if (!order || order.paymentStatus === "REFUNDED") break; // Idempotent

        await db.order.update({
          where: { id: order.id },
          data: { paymentStatus: "REFUNDED" },
        });
        await db.orderEvent.create({
          data: {
            orderId: order.id,
            type: "PAYMENT",
            value: "REFUNDED",
            note: `Razorpay webhook processed refund (ID: ${refund?.id ?? payment?.id ?? "unknown"})`,
            createdBy: "razorpay-webhook",
          },
        });
        console.log(`[razorpay-webhook] refund.processed → order ${order.orderNumber} marked REFUNDED`);
        break;
      }

      default:
        // Unhandled event type — ack with 200 so Razorpay stops retrying.
        break;
    }

    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
