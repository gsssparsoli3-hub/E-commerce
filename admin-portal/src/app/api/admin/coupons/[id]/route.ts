import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, notFound, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/coupons/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) return notFound("Coupon not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.type !== undefined) data.type = body.type === "FLAT" ? "FLAT" : "PERCENT";
    if (body.value !== undefined) data.value = Math.round(Number(body.value) || existing.value);
    if (body.minOrder !== undefined) data.minOrder = Math.round(Number(body.minOrder) || 0);
    if (body.maxDiscount !== undefined) data.maxDiscount = body.maxDiscount ? Math.round(Number(body.maxDiscount)) : null;
    if (body.usageLimit !== undefined) data.usageLimit = body.usageLimit ? Math.round(Number(body.usageLimit)) : null;
    if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : null;
    if (body.status !== undefined && ["ACTIVE", "DISABLED"].includes(body.status)) data.status = body.status;

    const coupon = await db.coupon.update({ where: { id }, data });
    return json({ coupon: { ...coupon, expiresAt: coupon.expiresAt?.toISOString() ?? null } });
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/admin/coupons/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;
    await db.coupon.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
