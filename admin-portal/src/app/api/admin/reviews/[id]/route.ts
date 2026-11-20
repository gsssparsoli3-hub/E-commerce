import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, badRequest, forbidden, notFound, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/reviews/[id] — toggle status (PUBLISHED <-> HIDDEN)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const body = await req.json();
    const status = String(body.status ?? "");
    if (!["PUBLISHED", "HIDDEN"].includes(status)) return badRequest("Status must be PUBLISHED or HIDDEN");

    const review = await db.review.findUnique({ where: { id } });
    if (!review) return notFound("Review not found");

    await db.review.update({ where: { id }, data: { status } });

    // Recompute product aggregates (only PUBLISHED reviews count)
    const agg = await db.review.aggregate({
      where: { productId: review.productId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await db.product.update({
      where: { id: review.productId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count.rating,
      },
    });

    return json({ ok: true, status });
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/admin/reviews/[id] — hard delete a review
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();
    const { id } = await params;

    const review = await db.review.findUnique({ where: { id } });
    if (!review) return notFound("Review not found");

    await db.review.delete({ where: { id } });

    // Recompute product aggregates
    const agg = await db.review.aggregate({
      where: { productId: review.productId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await db.product.update({
      where: { id: review.productId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count.rating,
      },
    });

    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
