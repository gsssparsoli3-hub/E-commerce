import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, forbidden, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/stats — dashboard metrics (revenue, sales chart, statuses, recent orders)
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden();

    const now = new Date();
    const since14 = new Date(now.getTime() - 13 * 86400000);
    since14.setHours(0, 0, 0, 0);

    const [paidAgg, allOrders, customers, productCount, lowStock, recent, topItems] = await Promise.all([
      db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
      db.order.findMany({ select: { status: true, createdAt: true, total: true } }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.product.count(),
      db.product.findMany({
        where: { stock: { lte: 5 }, status: "ACTIVE" },
        select: { id: true, name: true, stock: true, sku: true },
        take: 8,
        orderBy: { stock: "asc" },
      }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { items: true, user: { select: { name: true } } },
      }),
      db.orderItem.groupBy({
        by: ["name"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    // 14-day sales series
    const series: { date: string; total: number; orders: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const day = new Date(since14.getTime() + i * 86400000);
      const next = new Date(day.getTime() + 86400000);
      const dayOrders = allOrders.filter(
        (o) => o.createdAt >= day && o.createdAt < next && o.status !== "CANCELLED"
      );
      series.push({
        date: day.toISOString().slice(5, 10),
        total: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
      });
    }

    const statusCounts = allOrders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    return json({
      stats: {
        revenue: paidAgg._sum.total ?? 0,
        orderCount: allOrders.length,
        customerCount: customers,
        productCount,
        pendingOrders: statusCounts["PLACED"] ?? 0,
        lowStockCount: lowStock.length,
        salesSeries: series,
        statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        topProducts: topItems.map((t) => ({ name: t.name, sold: t._sum.quantity ?? 0, revenue: 0 })),
        lowStock,
      },
      recentOrders: recent.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.length,
        customer: o.user.name,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
