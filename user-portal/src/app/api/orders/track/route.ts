import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, serverError, isEmail } from "@/lib/api-helpers";
import { rateLimit, clientKey } from "@/lib/rate-limit";

/**
 * POST /api/orders/track
 * Guest order tracking — anyone can check an order with its number + the
 * email used at checkout. Returns limited, non-sensitive info only.
 */
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(clientKey(req, "track"), 10, 60_000)) {
      return badRequest("Too many attempts. Please wait a minute and try again.");
    }

    const body = await req.json();
    const orderNumber = String(body.orderNumber ?? "").trim().toUpperCase();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!orderNumber || !email) return badRequest("Order number and email are required");
    if (!isEmail(email)) return badRequest("Please enter a valid email address");
    if (orderNumber.length > 30) return badRequest("Invalid order number");

    // Order number + owner's email must match (prevents enumeration)
    const order = await db.order.findFirst({
      where: { orderNumber },
      include: {
        user: { select: { email: true } },
        items: { select: { name: true, quantity: true, image: true, price: true } },
        events: { orderBy: { createdAt: "asc" }, select: { type: true, value: true, note: true, createdAt: true } },
      },
    });

    if (!order || order.user.email.toLowerCase() !== email) {
      // Same message for both cases — never reveal which part was wrong
      return notFound("No order found with this number and email combination");
    }

    // Non-sensitive response — no address, no user id, no payment ids
    return json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        total: order.total,
        subtotal: order.subtotal,
        discount: order.discount,
        shipping: order.shipping,
        couponCode: order.couponCode,
        placedAt: order.createdAt,
        updatedAt: order.updatedAt,
        confirmedAt: order.confirmedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
        // Tracking is non-sensitive and needed so the customer can follow their shipment
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        items: order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          image: i.image,
          price: i.price,
        })),
        events: order.events.map((e) => ({
          type: e.type,
          value: e.value,
          note: e.note,
          createdAt: e.createdAt,
        })),
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
