import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { json, serverError } from "@/lib/api-helpers";
import { serializeProduct, productInclude } from "@/lib/serializers";

// GET /api/products — public catalog with filters, search, sort, pagination
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(48, Math.max(1, Number(sp.get("limit")) || 12));
    const search = sp.get("search")?.trim() ?? "";
    const category = sp.get("category")?.trim() ?? "";
    const sort = sp.get("sort") ?? "newest";
    const minPrice = Number(sp.get("minPrice")) || 0;
    const maxPrice = Number(sp.get("maxPrice")) || 0;
    const minRating = Number(sp.get("minRating")) || 0;
    const inStock = sp.get("inStock") === "1";
    const featured = sp.get("featured") === "1";

    const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (category) where.category = { slug: category };
    if (featured) where.featured = true;
    if (inStock) where.stock = { gt: 0 };
    if (minRating) where.rating = { gte: minRating };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price-asc" ? { price: "asc" }
      : sort === "price-desc" ? { price: "desc" }
      : sort === "popular" ? { soldCount: "desc" }
      : sort === "rating" ? { rating: "desc" }
      : sort === "discount" ? [{ mrp: "desc" }, { price: "asc" }] as unknown as Prisma.ProductOrderByWithRelationInput
      : { createdAt: "desc" };

    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        orderBy,
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
