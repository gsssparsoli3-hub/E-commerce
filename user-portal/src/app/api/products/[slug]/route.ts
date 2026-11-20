import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { cachedJson, notFound, serverError } from "@/lib/api-helpers";
import { serializeProduct, productInclude } from "@/lib/serializers";

// GET /api/products/[slug] — single product + related + reviews + frequently-bought-together (cached)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await db.product.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: productInclude,
    });
    if (!product || product.status !== "ACTIVE") return notFound("Product not found");

    // Fetch related + reviews + frequently-bought-together in parallel
    const [related, reviews, fbtReviews, frequentlyBought] = await Promise.all([
      db.product.findMany({
        where: { categoryId: product.categoryId, status: "ACTIVE", id: { not: product.id } },
        take: 4,
        orderBy: { soldCount: "desc" },
        include: productInclude,
      }),
      db.review.findMany({
        where: { productId: product.id, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, rating: true, title: true, comment: true, createdAt: true,
          userId: true,
          user: { select: { id: true, name: true } },
        },
        take: 50,
      }),
      // For verified-purchase: find which reviewers actually bought this product
      db.orderItem.findMany({
        where: {
          productId: product.id,
          order: { status: { in: ["DELIVERED", "SHIPPED", "CONFIRMED"] } },
        },
        select: { order: { select: { userId: true } } },
        distinct: ["orderId"],
      }),
      // Frequently bought together: 2 top sellers from same category (different from related set)
      db.product.findMany({
        where: { categoryId: product.categoryId, status: "ACTIVE", id: { not: product.id } },
        take: 2,
        orderBy: { soldCount: "desc" },
        select: { id: true, name: true, slug: true, price: true, mrp: true, images: true },
      }),
    ]);

    // Build a set of user IDs who purchased this product (for verified-purchase badges)
    const verifiedUserIds = new Set(fbtReviews.map((oi) => oi.order.userId));

    return cachedJson({
      product: serializeProduct(product),
      related: related.map(serializeProduct),
      reviews: reviews.map((r) => ({
        ...r,
        verifiedPurchase: verifiedUserIds.has(r.userId),
      })),
      frequentlyBought: frequentlyBought.map((p) => {
        const imgs = JSON.parse(p.images || "[]") as string[];
        return { id: p.id, name: p.name, slug: p.slug, price: p.price, mrp: p.mrp, image: imgs[0] ?? "" };
      }),
    }, { sMaxage: 120, swr: 600 });
  } catch (error) {
    return serverError(error);
  }
}
