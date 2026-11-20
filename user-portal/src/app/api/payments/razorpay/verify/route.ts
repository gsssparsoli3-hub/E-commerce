import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { json, badRequest, notFound, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";

/**
 * POST /api/payments/razorpay/verify
 * Verifies the Razorpay checkout signature (HMAC SHA256) and marks the order PAID.
 * This is the real verification flow used in production Razorpay integrations.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized();

    const body = await req.json();
    const razorpay_order_id = String(body.razorpay_order_id ?? "");
    const razorpay_payment_id = String(body.razorpay_payment_id ?? "");
    const razorpay_signature = String(body.razorpay_signature ?? "");

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return badRequest("Missing payment confirmation fields");
    }

    const order = await db.order.findFirst({
      where: { razorpayOrderId: razorpay_order_id, userId: user.id },
    });
    if (!order) return notFound("Order not found for this payment");

    const settings = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (!settings?.razorpayKeySecret) return badRequest("Payment gateway is not configured");

    // Real signature verification: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const expected = crypto
      .createHmac("sha256", settings.razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      await db.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
      return badRequest("Payment verification failed");
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paymentId: razorpay_payment_id,
        status: order.status === "PLACED" ? "CONFIRMED" : order.status,
        confirmedAt: order.status === "PLACED" ? new Date() : order.confirmedAt,
      },
      include: { items: true },
    });

    // Audit: payment captured + (optional) auto-confirm
    await db.orderEvent.createMany({
      data: [
        { orderId: order.id, type: "PAYMENT", value: "PAID", note: `Razorpay payment captured (ID: ${razorpay_payment_id})`, createdBy: "system" },
        ...(order.status === "PLACED" ? [{ orderId: order.id, type: "STATUS", value: "CONFIRMED", note: "Auto-confirmed after payment", createdBy: "system" }] : []),
      ],
    });

    return json({ ok: true, order: { id: updated.id, orderNumber: updated.orderNumber, paymentStatus: updated.paymentStatus } });
  } catch (error) {
    return serverError(error);
  }
}
