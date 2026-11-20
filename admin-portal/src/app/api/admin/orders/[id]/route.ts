import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { serializeOrder } from "@/lib/serializers";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

// Known courier tracking URL templates (auto-build trackingUrl when admin picks one + enters AWB)
const COURIER_TRACKING_BASE: Record<string, string> = {
  Delhivery: "https://www.delhivery.com/track/package/",
  BlueDart: "https://www.bluedart.com/tracking/trackdart?trackno=",
  DTDC: "https://www.dtdc.com/tracking/track.asp?strCnno=",
  FedEx: "https://www.fedex.com/fedextrack/?trknbr=",
  "India Post": "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?vid=",
  EcomExpress: "https://ecomexpress.in/tracking/?awb_field=",
  Xpressbees: "https://www.xpressbees.com/track?trackid=",
  Shadowfax: "https://track.shadowfax.in/",
  Other: "",
};

/** PATCH /api/admin/orders/[id]
 *  - status, paymentStatus (existing)
 *  - courierName, trackingNumber, trackingUrl (new — set when shipping)
 *  - notes (admin note)
 *  Auto-sets lifecycle timestamps + writes OrderEvent audit rows.
 *  COD orders are auto-marked PAID when delivered.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const order = await db.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return notFound("Order not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};
    const events: { type: string; value: string | null; note: string | null; createdBy: string }[] = [];
    const createdBy = admin.email;

    // ---- status ----
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return badRequest("Invalid status");
      if (order.status !== status) {
        data.status = status;
        const now = new Date();
        if (status === "CONFIRMED" && !order.confirmedAt) data.confirmedAt = now;
        if (status === "SHIPPED" && !order.shippedAt) data.shippedAt = now;
        if (status === "DELIVERED" && !order.deliveredAt) data.deliveredAt = now;
        if (status === "CANCELLED" && !order.cancelledAt) data.cancelledAt = now;
        events.push({ type: "STATUS", value: status, note: `Order marked ${status}`, createdBy });
        // COD delivered → collect payment automatically
        if (status === "DELIVERED" && order.paymentMethod === "COD" && order.paymentStatus === "PENDING") {
          data.paymentStatus = "PAID";
          events.push({ type: "PAYMENT", value: "PAID", note: "Cash collected on delivery", createdBy });
        }
      }
    }

    // ---- payment status ----
    if (body.paymentStatus !== undefined) {
      const ps = String(body.paymentStatus);
      if (!PAYMENT_STATUSES.includes(ps as (typeof PAYMENT_STATUSES)[number])) return badRequest("Invalid payment status");
      if (order.paymentStatus !== ps) {
        // If status change above already set paymentStatus (COD delivered), don't duplicate
        if (data.paymentStatus !== ps) {
          data.paymentStatus = ps;
          events.push({ type: "PAYMENT", value: ps, note: `Payment marked ${ps}`, createdBy });
        }
      }
    }

    // ---- tracking fields (allowed when shipping / shipped) ----
    const nextStatus = (data.status as string) ?? order.status;
    if (body.courierName !== undefined) {
      const cn = String(body.courierName).trim();
      data.courierName = cn || null;
    }
    if (body.trackingNumber !== undefined) {
      const tn = String(body.trackingNumber).trim();
      data.trackingNumber = tn || null;
    }
    if (body.trackingUrl !== undefined) {
      const tu = String(body.trackingUrl).trim();
      data.trackingUrl = tu || null;
    }
    // Auto-build tracking URL from courier + AWB if admin didn't provide a custom URL
    if ((data.trackingNumber || order.trackingNumber) && (data.courierName || order.courierName)) {
      const awb = (data.trackingNumber as string) ?? order.trackingNumber;
      const courier = (data.courierName as string) ?? order.courierName;
      const hasUrl = (data.trackingUrl as string) ?? order.trackingUrl;
      if (awb && courier && !hasUrl && COURIER_TRACKING_BASE[courier]) {
        data.trackingUrl = `${COURIER_TRACKING_BASE[courier]}${awb}`;
      }
    }
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).slice(0, 500) : null;

    // Record a TRACKING event when tracking info is first attached or changed
    const trackingChanged =
      data.courierName !== undefined || data.trackingNumber !== undefined || data.trackingUrl !== undefined;
    if (trackingChanged) {
      const awb = (data.trackingNumber as string) ?? order.trackingNumber ?? "";
      const courier = (data.courierName as string) ?? order.courierName ?? "";
      if (awb) {
        events.push({
          type: "TRACKING",
          value: awb,
          note: courier ? `Shipped via ${courier} — AWB ${awb}` : `Tracking ${awb}`,
          createdBy,
        });
      }
    }

    // ---- execute (cancel = transaction with stock restore) ----
    if (data.status === "CANCELLED" && order.status !== "CANCELLED") {
      await db.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
          });
        }
        if (order.paymentStatus === "PAID" && !body.paymentStatus) {
          data.paymentStatus = "REFUNDED";
          events.push({ type: "PAYMENT", value: "REFUNDED", note: "Refund initiated (order cancelled)", createdBy });
        }
        const updated = await tx.order.update({ where: { id }, data });
        if (events.length) {
          await tx.orderEvent.createMany({ data: events.map((e) => ({ orderId: id, ...e })) });
        }
        return updated;
      });
    } else {
      await db.$transaction(async (tx) => {
        await tx.order.update({ where: { id }, data });
        if (events.length) {
          await tx.orderEvent.createMany({ data: events.map((e) => ({ orderId: id, ...e })) });
        }
      });
    }

    const updated = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { createdAt: "asc" } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return json({
      order: { ...serializeOrder(updated!), customer: updated!.user.name, customerEmail: updated!.user.email },
    });
  } catch (error) {
    return serverError(error);
  }
}
