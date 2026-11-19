import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/categories/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return notFound("Category not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) return badRequest("Category name is required");
      data.name = name;
    }
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.image !== undefined) data.image = body.image ? String(body.image) : null;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;
    if (body.status !== undefined && ["ACTIVE", "HIDDEN"].includes(body.status)) data.status = body.status;

    const category = await db.category.update({ where: { id }, data });
    return json({ category });
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/admin/categories/[id] — blocked if it has products
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const count = await db.product.count({ where: { categoryId: id } });
    if (count > 0) return badRequest(`This category has ${count} products. Move or delete them first.`);

    await db.category.delete({ where: { id } });
    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
