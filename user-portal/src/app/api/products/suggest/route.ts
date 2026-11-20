import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { cachedJson, serverError } from "@/lib/api-helpers";

/**
 * GET /api/products/suggest?q=bose
 * Lightweight autocomplete for the search bar — returns up to 6 matching
 * products (name, slug, image, price) plus category matches. Cheap query,
 * cached at the edge for 30s.
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return cachedJson({ products: [], categories: [] }, { sMaxage: 30, swr: 60 });

    const [products, categories] = await Promise.all([
      db.product.findMany({
        where: { status: "ACTIVE", name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, slug: true, price: true, images: true },
        take: 6,
        orderBy: { soldCount: "desc" },
      }),
      db.category.findMany({
        where: { status: "ACTIVE", name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, slug: true, image: true },
        take: 3,
      }),
    ]);

    return cachedJson({
      products: products.map((p) => {
        const imgs = JSON.parse(p.images || "[]") as string[];
        return { id: p.id, name: p.name, slug: p.slug, price: p.price, image: imgs[0] ?? "" };
      }),
      categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, image: c.image })),
    }, { sMaxage: 30, swr: 60 });
  } catch (error) {
    return serverError(error);
  }
}
