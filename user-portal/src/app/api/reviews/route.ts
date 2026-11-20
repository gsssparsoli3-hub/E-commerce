import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, notFound, serverError, unauthorized } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";

// GET /api/reviews?productId= — published reviews for a product
export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) return badRequest("productId is required");

    const reviews = await db.review.findMany({
      where: { productId, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, rating: true, title: true, comment: true, createdAt: true,
        user: { select: { id: true, name: true } },
      },
      take: 50,
    });
    return json({ reviews });
  } catch (error) {
    return serverError(error);
  }
}

// POST /api/reviews — create/update own review (one per product)
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorized("Sign in to write a review");

    const body = await req.json();
    const productId = String(body.productId ?? "");
    const rating = Math.round(Number(body.rating));
    const comment = String(body.comment ?? "").trim();

    if (!productId) return badRequest("productId is required");
    if (!rating || rating < 1 || rating > 5) return badRequest("Rating must be between 1 and 5");
    if (comment.length < 4) return badRequest("Please write a short review");

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return notFound("Product not found");

    // Verified-purchase check: the reviewer must have a DELIVERED order
    // containing this product. Prevents spam reviews on products never bought.
    const hasPurchased = await db.orderItem.findFirst({
      where: {
        productId,
        order: { userId: user.id, status: { in: ["DELIVERED", "SHIPPED", "CONFIRMED"] } },
      },
      select: { id: true },
      take: 1,
    });
    if (!hasPurchased) {
      return badRequest("You can only review products you have purchased and received");
    }

    await db.review.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      update: { rating, comment, title: body.title ? String(body.title).trim() : null, status: "PUBLISHED" },
      create: {
        userId: user.id, productId, rating,
        comment, title: body.title ? String(body.title).trim() : null,
      },
    });

    // Recompute aggregates
    const agg = await db.review.aggregate({
      where: { productId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const productUpdate = db.product.update({
      where: { id: productId },
      data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count.rating },
    });

    // Return the review WITH the user relation (the client renders review.user.name)
    const [review] = await Promise.all([
      db.review.findFirst({
        where: { userId: user.id, productId },
        select: {
          id: true, rating: true, title: true, comment: true, createdAt: true,
          user: { select: { id: true, name: true } },
        },
      }),
      productUpdate,
    ]);

    return json({ review });
  } catch (error) {
    return serverError(error);
  }
}
