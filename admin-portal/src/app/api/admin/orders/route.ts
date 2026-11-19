import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { serializeOrder } from "@/lib/serializers";

// GET /api/admin/orders — all orders with filters + pagination
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Number(sp.get("limit")) || 20);
    const status = sp.get("status") ?? "";
    const paymentStatus = sp.get("paymentStatus") ?? "";
    const search = sp.get("search")?.trim() ?? "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];

    const [total, orders] = await Promise.all([
      db.order.count({ where }),
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true, user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    return json({
      orders: orders.map((o) => ({
        ...serializeOrder(o),
        customer: o.user.name,
        customerEmail: o.user.email,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return serverError(error);
  }
}
