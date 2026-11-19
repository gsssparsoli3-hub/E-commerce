import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";
import { serializeProduct, productInclude } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return json({ items: [] });

    const items = await db.wishlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { product: { include: productInclude } },
    });
    return json({
      items: items
        .filter((i) => i.product.status === "ACTIVE")
        .map((i) => ({ id: i.id, product: serializeProduct(i.product) })),
    });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/wishlist — toggle a product in the wishlist
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized("Sign in to save items to your wishlist");

    const body = await req.json();
    const productId = String(body.productId ?? "");
    if (!productId) return badRequest("productId is required");

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return notFound("Product not found");

    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } });
      return json({ added: false });
    }
    await db.wishlistItem.create({ data: { userId: user.id, productId } });
    return json({ added: true });
  } catch (error) {
    return serverError(error);
  }
}
