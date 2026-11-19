"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "../shared/status-badge";
import { Pagination } from "../shared/pagination";
import { api } from "@/lib/client-api";
import { formatINR, formatDateTime, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/format";
import type { Order } from "@/types";

type AdminOrder = Order & { customer: string; customerEmail: string };
type ListResponse = { orders: AdminOrder[]; pagination: { page: number; pages: number; total: number } };

export function AdminOrdersView() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  function load() {
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
    api<ListResponse>(`/admin/orders?${params}`).then(setData).catch(() => null);
  }

  useEffect(() => {
    load();
  }, [page, search, status, paymentStatus]);

  async function updateOrder(order: AdminOrder, patch: Record<string, string>) {
    try {
      await api(`/admin/orders/${order.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      toast.success(`Order ${order.orderNumber} updated`);
      setSelected(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Orders</h1>
        {data && <span className="text-sm text-muted-foreground">({data.pagination.total} total)</span>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search order no. or customer…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {!data ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-13" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3 font-medium">Order</th>
                    <th className="p-3 font-medium">Customer</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Payment</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((o) => (
                    <tr
                      key={o.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                      onClick={() => setSelected(o)}
                    >
                      <td className="p-3 font-semibold">{o.orderNumber}</td>
                      <td className="p-3">
                        <p>{o.customer}</p>
                        <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={o.paymentMethod} />
                          <StatusBadge status={o.paymentStatus} />
                        </div>
                      </td>
                      <td className="p-3"><StatusBadge status={o.status} /></td>
                      <td className="p-3 font-bold">{formatINR(o.total)}</td>
                      <td className="p-3"><ChevronRight className="h-4 w-4 text-muted-foreground" /></td>
                    </tr>
                  ))}
                  {data.orders.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />}

      {/* Detail sheet */}
      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetTitle className="mb-4">Order {selected?.orderNumber}</SheetTitle>
          {selected && (
            <div className="space-y-5 text-sm">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selected.status} />
                <StatusBadge status={selected.paymentMethod} />
                <StatusBadge status={selected.paymentStatus} />
              </div>
              <div className="text-xs text-muted-foreground">
                Placed {formatDateTime(selected.createdAt)}
                {selected.paymentId && <> · Payment ID <span className="font-mono">{selected.paymentId}</span></>}
              </div>

              {/* Update status */}
              <div className="space-y-2 rounded-xl border p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Update order status</p>
                <div className="flex flex-wrap gap-1.5">
                  {ORDER_STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.status === s ? "default" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => updateOrder(selected, { status: s })}
                      disabled={selected.status === s}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
                <p className="pt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Payment status</p>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.paymentStatus === s ? "default" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => updateOrder(selected, { paymentStatus: s })}
                      disabled={selected.paymentStatus === s}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Items</p>
                <div className="space-y-2.5">
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.image} alt="" className="h-11 w-11 rounded-md object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty {item.quantity} × {formatINR(item.price)}</p>
                      </div>
                      <span className="font-semibold">{formatINR(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address */}
              {selected.address && (
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Delivery address</p>
                  <p className="text-sm leading-relaxed">
                    {selected.address.fullName}, {selected.address.phone}<br />
                    {selected.address.line1}{selected.address.line2 ? `, ${selected.address.line2}` : ""}<br />
                    {selected.address.city}, {selected.address.state} — {selected.address.pincode}
                  </p>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-1 rounded-xl border p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(selected.subtotal)}</span></div>
                {selected.discount > 0 && (
                  <div className="flex justify-between text-emerald-600"><span>Coupon ({selected.couponCode})</span><span>−{formatINR(selected.discount)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{selected.shipping === 0 ? "FREE" : formatINR(selected.shipping)}</span></div>
                <div className="flex justify-between border-t pt-1 font-bold"><span>Total</span><span>{formatINR(selected.total)}</span></div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
