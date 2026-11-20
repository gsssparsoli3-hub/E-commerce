"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, IndianRupee, Package,
  ShoppingCart, TrendingUp, Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "../shared/status-badge";
import { api } from "@/lib/client-api";
import { formatINR, formatDateTime } from "@/lib/format";
import type { AdminStats } from "@/types";

type RecentOrder = {
  id: string; orderNumber: string; total: number; paymentStatus: string;
  paymentMethod: string; status: string; createdAt: string; itemCount: number; customer: string;
};

export function DashboardView() {
  const [data, setData] = useState<{ stats: AdminStats; recentOrders: RecentOrder[] } | null>(null);

  useEffect(() => {
    api<{ stats: AdminStats; recentOrders: RecentOrder[] }>("/admin/stats")
      .then(setData)
      .catch(() => null);
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const { stats, recentOrders } = data;
  const cards = [
    { title: "Total Revenue", value: formatINR(stats.revenue), icon: IndianRupee, hint: "from paid orders", trend: "up" },
    { title: "Orders", value: String(stats.orderCount), icon: ShoppingCart, hint: `${stats.pendingOrders} awaiting action`, trend: "up" },
    { title: "Customers", value: String(stats.customerCount), icon: Users, hint: "registered shoppers", trend: "flat" },
    { title: "Products", value: String(stats.productCount), icon: Package, hint: `${stats.lowStockCount} low on stock`, trend: "flat" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{c.title}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight">{c.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.hint}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + status */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Sales — last 14 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.salesSeries} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => (v >= 100000 ? `₹${Math.round(v / 100000)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)}
                  />
                  <Tooltip
                    formatter={(value: number | string, name: string) =>
                      name === "total" ? [formatINR(Number(value)), "Revenue"] : [value, "Orders"]
                    }
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2.5} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders by status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {stats.statusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                stats.statusBreakdown.map((s) => {
                  const pct = stats.orderCount ? Math.round((s.count / stats.orderCount) * 100) : 0;
                  return (
                    <div key={s.status} className="flex items-center gap-2 text-sm">
                      <StatusBadge status={s.status} className="w-24 justify-center" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold">{s.count}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">All products are well stocked.</p>
              ) : (
                <div className="max-h-44 space-y-2 overflow-y-auto">
                  {stats.lowStock.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="line-clamp-1">{p.name}</span>
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {p.stock} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-125 text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Order</th>
                  <th className="pb-2 pr-4 font-medium">Customer</th>
                  <th className="pb-2 pr-4 font-medium">Items</th>
                  <th className="pb-2 pr-4 font-medium">Payment</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No orders yet — they&apos;ll appear here as customers place them.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-semibold">{o.orderNumber}</td>
                      <td className="py-2.5 pr-4">{o.customer || "—"}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{o.itemCount}</td>
                      <td className="py-2.5 pr-4"><StatusBadge status={o.paymentStatus} /></td>
                      <td className="py-2.5 pr-4"><StatusBadge status={o.status} /></td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                      <td className="py-2.5 text-right font-bold">{formatINR(o.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
