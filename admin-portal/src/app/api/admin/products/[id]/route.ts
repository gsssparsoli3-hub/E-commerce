import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, forbidden, serverError, slugify } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { serializeProduct, productInclude } from "@/lib/serializers";

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/products/[id] — update product
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return notFound("Product not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 3) return badRequest("Product name is required");
      data.name = name;
      if (slugify(name) !== existing.slug) data.slug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`;
    }
    if (body.description !== undefined) data.description = String(body.description).trim();
    if (body.price !== undefined) {
      const price = Math.round(Number(body.price));
      if (!price || price < 100) return badRequest("Enter a valid price");
      data.price = price;
    }
    if (body.mrp !== undefined) data.mrp = Math.round(Number(body.mrp) || Number(body.price));
    if (body.stock !== undefined) data.stock = Math.max(0, Number(body.stock) || 0);
    if (body.categoryId !== undefined) data.categoryId = String(body.categoryId);
    if (body.images !== undefined) {
      const images = Array.isArray(body.images) ? body.images.filter((i: unknown) => typeof i === "string" && i) : [];
      if (images.length === 0) return badRequest("Add at least one product image");
      data.images = JSON.stringify(images);
    }
    if (body.tags !== undefined) data.tags = JSON.stringify(Array.isArray(body.tags) ? body.tags : []);
    if (body.brand !== undefined) data.brand = body.brand ? String(body.brand).trim() : null;
    if (body.warranty !== undefined) data.warranty = body.warranty ? String(body.warranty).trim() : null;
    if (body.highlights !== undefined) data.highlights = JSON.stringify(Array.isArray(body.highlights) ? body.highlights.filter((h: unknown) => typeof h === "string" && String(h).trim()) : []);
    if (body.specifications !== undefined) data.specifications = JSON.stringify(body.specifications && typeof body.specifications === "object" ? body.specifications : {});
    if (body.featured !== undefined) data.featured = body.featured === true;
    if (body.status !== undefined && ["ACTIVE", "DRAFT", "ARCHIVED"].includes(body.status)) data.status = body.status;

    const product = await db.product.update({ where: { id }, data, include: productInclude });
    return json({ product: serializeProduct(product) });
  } catch (error) {
    return serverError(error);
  }
}

// PATCH /api/admin/products/[id] — quick toggles (featured/status/stock)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.featured !== undefined) data.featured = body.featured === true;
    if (body.status !== undefined && ["ACTIVE", "DRAFT", "ARCHIVED"].includes(body.status)) data.status = body.status;
    if (body.stock !== undefined) data.stock = Math.max(0, Number(body.stock) || 0);

    const product = await db.product.update({ where: { id }, data, include: productInclude });
    return json({ product: serializeProduct(product) });
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const inOrders = await db.orderItem.count({ where: { productId: id }, take: 1 });
    if (inOrders > 0) {
      // Product has order history — archive instead of delete to keep order integrity
      await db.product.update({ where: { id }, data: { status: "ARCHIVED", featured: false } });
      return json({ ok: true, archived: true });
    }

    await db.cartItem.deleteMany({ where: { productId: id } });
    await db.wishlistItem.deleteMany({ where: { productId: id } });
    await db.review.deleteMany({ where: { productId: id } });
    await db.product.delete({ where: { id } });
    return json({ ok: true, archived: false });
  } catch (error) {
    return serverError(error);
  }
}
