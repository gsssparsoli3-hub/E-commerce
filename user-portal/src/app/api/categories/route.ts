import { db } from "@/lib/db";
import { cachedJson, serverError } from "@/lib/api-helpers";

// GET /api/categories — active categories with product counts (cached 5min)
export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
    });
    return cachedJson({
      categories: categories.map((c) => ({
        id: c.id, name: c.name, slug: c.slug, description: c.description,
        image: c.image, status: c.status, sortOrder: c.sortOrder,
        productCount: c._count.products,
      })),
    }, { sMaxage: 300, swr: 600 });
  } catch (error) {
    return serverError(error);
  }
}
