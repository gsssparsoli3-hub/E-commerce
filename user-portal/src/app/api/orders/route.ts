import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";
import { serializeOrder } from "@/lib/serializers";
import { computeDiscount, computeShipping } from "@/lib/pricing";

const orderWithItems = {
  items: true,
  events: { orderBy: { createdAt: "asc" as const } },
} as const;

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized();

    const orders = await db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true, events: { orderBy: { createdAt: "asc" } } },
    });
    return json({ orders: orders.map(serializeOrder) });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * POST /api/orders — place an order.
 * Prices/stock/coupon are all recomputed server-side (client totals are never trusted).
 * paymentMethod: "COD" | "RAZORPAY"
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized("Sign in to place an order");

    const body = await req.json();
    const paymentMethod = body.paymentMethod === "RAZORPAY" ? "RAZORPAY" : "COD";
    const addressId = String(body.addressId ?? "");
    const couponCode = body.couponCode ? String(body.couponCode).trim().toUpperCase() : null;

    // ---- Resolve items: buy-now (single) or entire cart ----
    type RawItem = { productId: string; quantity: number };
    const rawItems: RawItem[] = Array.isArray(body.items) && body.items.length > 0
      ? body.items
      : (await db.cartItem.findMany({ where: { userId: user.id } })).map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
        }));

    if (rawItems.length === 0) return badRequest("Your cart is empty");

    // ---- Address ----
    const address = addressId
      ? await db.address.findFirst({ where: { id: addressId, userId: user.id } })
      : null;
    if (!address) return badRequest("Please select a delivery address");

    // ---- Validate products & compute totals from DB ----
    const settings = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (!settings) return badRequest("Store is not configured yet");

    if (paymentMethod === "RAZORPAY" && (!settings.razorpayEnabled || !settings.razorpayKeyId || !settings.razorpayKeySecret)) {
      return badRequest("Online payments are currently unavailable. Please choose Cash on Delivery.");
    }
    if (paymentMethod === "COD" && !settings.codEnabled) {
      return badRequest("Cash on Delivery is currently disabled.");
    }

    const lineItems: {
      productId: string; name: string; image: string; price: number; quantity: number;
    }[] = [];

    for (const raw of rawItems) {
      const product = await db.product.findUnique({ where: { id: String(raw.productId) } });
      if (!product || product.status !== "ACTIVE") {
        return badRequest("One of the products is no longer available");
      }
      const quantity = Math.max(1, Math.min(10, Number(raw.quantity) || 1));
      if (product.stock < quantity) {
        return badRequest(`Only ${product.stock} left in stock for ${product.name}`);
      }
      const images = JSON.parse(product.images || "[]") as string[];
      lineItems.push({
        productId: product.id,
        name: product.name,
        image: images[0] ?? "",
        price: product.price,
        quantity,
      });
    }

    const subtotal = lineItems.reduce((s, it) => s + it.price * it.quantity, 0);

    // ---- Coupon ----
    let discount = 0;
    let appliedCoupon: string | null = null;
    if (couponCode && settings.couponsEnabled) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode } });
      const valid =
        coupon && coupon.status === "ACTIVE" &&
        (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit);
      if (!valid) return badRequest("The applied coupon is no longer valid");
      discount = computeDiscount(coupon, subtotal);
      if (discount <= 0) return badRequest("The coupon does not apply to this order");
      appliedCoupon = coupon.code;
      await db.coupon.update({ where: { code: coupon.code }, data: { usedCount: { increment: 1 } } });
    }

    const shipping = computeShipping(subtotal - discount, settings.shippingFee, settings.freeShippingAbove);
    const total = subtotal - discount + shipping;

    // ---- Create order (transaction: order + stock decrement) ----
    const orderNumber = `SP-${Date.now().toString(36).toUpperCase()}`;
    const order = await db.$transaction(async (tx) => {
      for (const it of lineItems) {
        const updated = await tx.product.updateMany({
          where: { id: it.productId, stock: { gte: it.quantity } },
          data: { stock: { decrement: it.quantity }, soldCount: { increment: it.quantity } },
        });
        if (updated.count === 0) throw new Error(`INSUFFICIENT_STOCK:${it.name}`);
      }
      return tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          addressJson: JSON.stringify({
            fullName: address.fullName, phone: address.phone, line1: address.line1,
            line2: address.line2, city: address.city, state: address.state,
            pincode: address.pincode, country: address.country,
          }),
          subtotal, discount, shipping, total,
          couponCode: appliedCoupon,
          paymentMethod,
          paymentStatus: "PENDING",
          status: "PLACED",
          items: { create: lineItems },
          events: { create: { type: "STATUS", value: "PLACED", note: "Order placed by customer", createdBy: user.email } },
        },
        include: orderWithItems,
      });
    });

    // ---- Razorpay: create gateway order for real payments ----
    let razorpay: { keyId: string; orderId: string; amount: number } | null = null;
    if (paymentMethod === "RAZORPAY") {
      const auth = Buffer.from(`${settings.razorpayKeyId}:${settings.razorpayKeySecret}`).toString("base64");
      const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
        body: JSON.stringify({ amount: total, currency: "INR", receipt: orderNumber }),
      });
      if (rpRes.ok) {
        const rpOrder = (await rpRes.json()) as { id: string };
        await db.order.update({
          where: { id: order.id },
          data: { razorpayOrderId: rpOrder.id },
        });
        razorpay = { keyId: settings.razorpayKeyId!, orderId: rpOrder.id, amount: total };
      } else {
        // Gateway failed — roll the order back to a failed state so stock/coupon are not lost silently
        await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED", paymentStatus: "FAILED" } });
        return badRequest("Payment gateway could not be reached. Please try again or use Cash on Delivery.");
      }
    }

    // ---- Clear cart for cart-based orders ----
    if (!Array.isArray(body.items)) {
      await db.cartItem.deleteMany({ where: { userId: user.id } });
    }

    return json({ order: serializeOrder(order), razorpay });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      return badRequest(`Not enough stock for ${message.split(":")[1]}`);
    }
    return serverError(error);
  }
}
