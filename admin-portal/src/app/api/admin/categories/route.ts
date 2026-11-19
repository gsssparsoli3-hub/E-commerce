import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, forbidden, serverError, slugify } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/categories — all categories incl. hidden
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return json({
      categories: categories.map((c) => ({
        id: c.id, name: c.name, slug: c.slug, description: c.description,
        image: c.image, status: c.status, sortOrder: c.sortOrder,
        productCount: c._count.products,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/admin/categories — create
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (name.length < 2) return badRequest("Category name is required");

    let slug = slugify(name);
    const exists = await db.category.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const category = await db.category.create({
      data: {
        name,
        slug,
        description: body.description ? String(body.description).trim() : null,
        image: body.image ? String(body.image) : null,
        sortOrder: Number(body.sortOrder) || 0,
        status: body.status === "HIDDEN" ? "HIDDEN" : "ACTIVE",
      },
    });
    return json({ category });
  } catch (error) {
    return serverError(error);
  }
}
