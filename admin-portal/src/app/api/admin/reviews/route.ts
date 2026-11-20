import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/reviews — all reviews with product + user info, filterable
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") ?? ""; // PUBLISHED | HIDDEN | ""
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Number(sp.get("limit")) || 20);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [total, reviews] = await Promise.all([
      db.review.count({ where }),
      db.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    return json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
        product: r.product,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return serverError(error);
  }
}
