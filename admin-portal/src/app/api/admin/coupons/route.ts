import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/coupons
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return json({
      coupons: coupons.map((c) => ({
        ...c,
        expiresAt: c.expiresAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/admin/coupons
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const body = await req.json();
    const code = String(body.code ?? "").trim().toUpperCase();
    const type = body.type === "FLAT" ? "FLAT" : "PERCENT";
    const value = Number(body.value);

    if (!/^[A-Z0-9]{3,20}$/.test(code)) return badRequest("Code must be 3-20 letters/numbers");
    if (!value || value <= 0) return badRequest("Enter a valid discount value");
    if (type === "PERCENT" && value > 90) return badRequest("Percent discount cannot exceed 90%");

    const exists = await db.coupon.findUnique({ where: { code } });
    if (exists) return badRequest("A coupon with this code already exists");

    const coupon = await db.coupon.create({
      data: {
        code,
        type,
        value: type === "FLAT" ? Math.round(value) : Math.round(value),
        minOrder: Math.round(Number(body.minOrder) || 0),
        maxDiscount: body.maxDiscount ? Math.round(Number(body.maxDiscount)) : null,
        usageLimit: body.usageLimit ? Math.round(Number(body.usageLimit)) : null,
        expiresAt: body.expiresAt ? new Date(String(body.expiresAt)) : null,
        status: body.status === "DISABLED" ? "DISABLED" : "ACTIVE",
      },
    });
    return json({ coupon: { ...coupon, expiresAt: coupon.expiresAt?.toISOString() ?? null } });
  } catch (error) {
    return serverError(error);
  }
}
