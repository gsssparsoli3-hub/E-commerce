import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/users — customer list with order stats
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const users = await db.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, status: true,
        createdAt: true, avatar: true,
        orders: { select: { total: true, status: true } },
      },
    });

    return json({
      users: users.map((u) => ({
        id: u.id, name: u.name, email: u.email, phone: u.phone,
        status: u.status, createdAt: u.createdAt.toISOString(), avatar: u.avatar,
        orderCount: u.orders.length,
        totalSpent: u.orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0),
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
