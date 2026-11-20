import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { json, badRequest, forbidden, serverError, slugify } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { serializeProduct, productInclude } from "@/lib/serializers";

// GET /api/admin/products — all products (incl. drafts) with admin filters
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim() ?? "";
    const category = sp.get("category") ?? "";
    const status = sp.get("status") ?? "";
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Number(sp.get("limit")) || 20);

    const where: Prisma.ProductWhereInput = {};
    if (search) where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
    if (category) where.category = { slug: category };
    if (status) where.status = status;

    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: productInclude,
      }),
    ]);

    return json({
      products: products.map(serializeProduct),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/admin/products — create product
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (name.length < 3) return badRequest("Product name is required");
    const price = Number(body.price);
    if (!price || price < 100) return badRequest("Enter a valid price (at least ₹1)");
    if (!body.categoryId) return badRequest("Select a category");

    const images = Array.isArray(body.images) ? body.images.filter((i: unknown) => typeof i === "string" && i) : [];
    if (images.length === 0) return badRequest("Add at least one product image");

    let slug = slugify(name);
    const exists = await db.product.findFirst({ where: { OR: [{ slug }, { sku: body.sku || "___" }] } });
    if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const sku = String(body.sku ?? "").trim() || `SP-${Date.now().toString(36).toUpperCase()}`;

    const product = await db.product.create({
      data: {
        name,
        slug,
        sku,
        description: String(body.description ?? "").trim(),
        price: Math.round(price),
        mrp: Math.round(Number(body.mrp) || price),
        stock: Math.max(0, Number(body.stock) || 0),
        categoryId: String(body.categoryId),
        images: JSON.stringify(images),
        tags: JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
        brand: body.brand ? String(body.brand).trim() : null,
        warranty: body.warranty ? String(body.warranty).trim() : null,
        highlights: JSON.stringify(Array.isArray(body.highlights) ? body.highlights.filter((h: unknown) => typeof h === "string" && String(h).trim()) : []),
        specifications: JSON.stringify(body.specifications && typeof body.specifications === "object" ? body.specifications : {}),
        featured: body.featured === true,
        status: ["ACTIVE", "DRAFT", "ARCHIVED"].includes(body.status) ? body.status : "ACTIVE",
      },
      include: productInclude,
    });
    return json({ product: serializeProduct(product) });
  } catch (error) {
    return serverError(error);
  }
}
