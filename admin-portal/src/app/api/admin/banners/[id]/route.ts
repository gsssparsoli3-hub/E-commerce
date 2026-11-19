import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, notFound, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/banners/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) return notFound("Banner not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.subtitle !== undefined) data.subtitle = body.subtitle ? String(body.subtitle).trim() : null;
    if (body.image !== undefined) data.image = String(body.image);
    if (body.link !== undefined) data.link = body.link ? String(body.link).trim() : null;
    if (body.ctaText !== undefined) data.ctaText = String(body.ctaText).trim() || "Shop Now";
    if (body.position !== undefined) data.position = body.position === "STRIP" ? "STRIP" : "HERO";
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;
    if (body.status !== undefined && ["ACTIVE", "HIDDEN"].includes(body.status)) data.status = body.status;

    const banner = await db.banner.update({ where: { id }, data });
    return json({ banner });
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/admin/banners/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;
    await db.banner.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
