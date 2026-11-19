import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { serializeOrder } from "@/lib/serializers";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/orders/[id] — update order/payment status (with stock restore on cancel)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const order = await db.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return notFound("Order not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return badRequest("Invalid status");
      data.status = status;
    }
    if (body.paymentStatus !== undefined) {
      const ps = String(body.paymentStatus);
      if (!PAYMENT_STATUSES.includes(ps as (typeof PAYMENT_STATUSES)[number])) return badRequest("Invalid payment status");
      data.paymentStatus = ps;
    }

    // Restore stock when moving to CANCELLED from an active state
    if (data.status === "CANCELLED" && order.status !== "CANCELLED") {
      await db.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
          });
        }
        if (order.paymentStatus === "PAID" && !body.paymentStatus) data.paymentStatus = "REFUNDED";
        await tx.order.update({ where: { id }, data });
      });
    } else {
      await db.order.update({ where: { id }, data });
    }

    const updated = await db.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    });
    return json({
      order: { ...serializeOrder(updated!), customer: updated!.user.name, customerEmail: updated!.user.email },
    });
  } catch (error) {
    return serverError(error);
  }
}
