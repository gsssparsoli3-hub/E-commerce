import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, notFound, serverError } from "@/lib/api-helpers";
import { serializeProduct, productInclude } from "@/lib/serializers";

// GET /api/products/[slug] — single product + related products
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

    const related = await db.product.findMany({
      where: { categoryId: product.categoryId, status: "ACTIVE", id: { not: product.id } },
      take: 4,
      orderBy: { soldCount: "desc" },
      include: productInclude,
    });

    return json({
      product: serializeProduct(product),
      related: related.map(serializeProduct),
    });
  } catch (error) {
    return serverError(error);
  }
}
