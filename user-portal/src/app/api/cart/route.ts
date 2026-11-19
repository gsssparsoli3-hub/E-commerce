import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";
import { serializeProduct, productInclude } from "@/lib/serializers";

async function getCart(userId: string) {
  const items = await db.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { include: productInclude } },
  });
  return items
    .filter((i) => i.product.status === "ACTIVE")
    .map((i) => ({ id: i.id, quantity: i.quantity, product: serializeProduct(i.product) }));
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return json({ items: [] });
    return json({ items: await getCart(user.id) });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/cart — add to cart (or increment quantity)
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized("Sign in to add items to your cart");

    const body = await req.json();
    const productId = String(body.productId ?? "");
    const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== "ACTIVE") return notFound("Product not found");
    if (product.stock < 1) return badRequest("This product is out of stock");

    const existing = await db.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    const newQty = Math.min(product.stock, (existing?.quantity ?? 0) + quantity);

    await db.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      update: { quantity: newQty },
      create: { userId: user.id, productId, quantity: newQty },
    });

    return json({ items: await getCart(user.id) });
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/cart — set quantity
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized();

    const body = await req.json();
    const itemId = String(body.itemId ?? "");
    const quantity = Number(body.quantity);

    const item = await db.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });
    if (!item || item.userId !== user.id) return notFound("Cart item not found");

    if (quantity <= 0) {
      await db.cartItem.delete({ where: { id: itemId } });
    } else {
      await db.cartItem.update({
        where: { id: itemId },
        data: { quantity: Math.min(item.product.stock, Math.min(10, quantity)) },
      });
    }
    return json({ items: await getCart(user.id) });
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/cart?itemId= (single) or ?all=1 (clear)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized();

    const sp = req.nextUrl.searchParams;
    if (sp.get("all") === "1") {
      await db.cartItem.deleteMany({ where: { userId: user.id } });
    } else {
      const itemId = sp.get("itemId");
      if (!itemId) return badRequest("itemId is required");
      const item = await db.cartItem.findUnique({ where: { id: itemId } });
      if (item && item.userId === user.id) await db.cartItem.delete({ where: { id: itemId } });
    }
    return json({ items: await getCart(user.id) });
  } catch (error) {
    return serverError(error);
  }
}
