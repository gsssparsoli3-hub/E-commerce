import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";
import { serializeOrder } from "@/lib/serializers";

// GET /api/orders/[id] — own order detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const order = await db.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }], userId: user.id },
      include: { items: true },
    });
    if (!order) return notFound("Order not found");
    return json({ order: serializeOrder(order) });
  } catch (error) {
    return serverError(error);
  }
}

// PATCH /api/orders/[id] — customer cancels an order (only while PLACED/CONFIRMED, restores stock)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const order = await db.order.findFirst({
      where: { id, userId: user.id },
      include: { items: true },
    });
    if (!order) return notFound("Order not found");

    if (order.status !== "PLACED" && order.status !== "CONFIRMED") {
      return badRequest("This order can no longer be cancelled. Contact support for help.");
    }

    await db.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
        });
      }
      if (order.couponCode) {
        await tx.coupon.update({
          where: { code: order.couponCode },
          data: { usedCount: { decrement: 1 } },
        }).catch(() => null);
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus },
      });
    });

    const updated = await db.order.findUnique({ where: { id: order.id }, include: { items: true } });
    return json({ order: serializeOrder(updated!) });
  } catch (error) {
    return serverError(error);
  }
}
