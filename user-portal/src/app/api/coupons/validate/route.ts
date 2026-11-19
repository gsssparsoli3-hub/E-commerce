import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";
import { computeDiscount } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized("Sign in to apply coupons");

    const body = await req.json();
    const code = String(body.code ?? "").trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;
    if (!code) return badRequest("Enter a coupon code");

    const settings = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (settings && !settings.couponsEnabled) {
      return badRequest("Coupons are currently disabled");
    }

    const coupon = await db.coupon.findUnique({ where: { code } });
    if (!coupon || coupon.status !== "ACTIVE") return badRequest("Invalid coupon code");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return badRequest("This coupon has expired");
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return badRequest("This coupon has reached its usage limit");
    if (subtotal < coupon.minOrder) {
      return badRequest(`This coupon requires a minimum order of ₹${Math.ceil(coupon.minOrder / 100)}`);
    }

    const discount = computeDiscount(coupon, subtotal);
    return json({ code: coupon.code, discount, type: coupon.type, value: coupon.value });
  } catch (error) {
    return serverError(error);
  }
}
