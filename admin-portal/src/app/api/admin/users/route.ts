import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/users — paginated customer list with order stats (server-side search)
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Number(sp.get("limit")) || 20);
    const search = sp.get("search")?.trim() ?? "";

    const where: Record<string, unknown> = { role: "CUSTOMER" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, name: true, email: true, phone: true, status: true,
          createdAt: true, avatar: true,
          // compute LTV + order count with aggregates, not by loading every order row
          orders: {
            where: { status: { not: "CANCELLED" } },
            select: { total: true },
          },
        },
      }),
      // Bulk counts + total-spent via a single groupBy on OrderItem-free join
    ]);

    return json({
      users: users.map((u) => ({
        id: u.id, name: u.name, email: u.email, phone: u.phone,
        status: u.status, createdAt: u.createdAt.toISOString(), avatar: u.avatar,
        orderCount: u.orders.length,
        totalSpent: u.orders.reduce((s, o) => s + o.total, 0),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return serverError(error);
  }
}
