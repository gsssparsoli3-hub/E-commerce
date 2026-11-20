"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, ChevronRight, ExternalLink, Package, PackageCheck,
  Search, Ship, Truck, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "../shared/status-badge";
import { Pagination } from "../shared/pagination";
import { api } from "@/lib/client-api";
import { formatINR, formatDateTime, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/format";
import type { Order, OrderEvent } from "@/types";

type AdminOrder = Order & { customer: string; customerEmail: string };
type ListResponse = { orders: AdminOrder[]; pagination: { page: number; pages: number; total: number } };

const COURIERS = ["Delhivery", "BlueDart", "DTDC", "FedEx", "India Post", "EcomExpress", "Xpressbees", "Shadowfax", "Other"];

const JOURNEY: { key: string; label: string; icon: typeof Package }[] = [
  { key: "PLACED", label: "Placed", icon: Package },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: PackageCheck },
];

const EVENT_LABEL: Record<string, { label: string; color: string }> = {
  STATUS: { label: "Status", color: "text-primary" },
  PAYMENT: { label: "Payment", color: "text-emerald-600" },
  TRACKING: { label: "Tracking", color: "text-blue-600" },
  NOTE: { label: "Note", color: "text-muted-foreground" },
};

export function AdminOrdersView() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [shipForm, setShipForm] = useState(false);
  const [tracking, setTracking] = useState({ courierName: "", trackingNumber: "", trackingUrl: "" });

  function load() {
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
    api<ListResponse>(`/admin/orders?${params}`).then(setData).catch(() => null);
  }

  useEffect(() => { load(); }, [page, search, status, paymentStatus]);

  async function refreshSelected() {
    if (!selected) return;
    try {
      const res = await api<{ order: AdminOrder }>(`/admin/orders/${selected.id}`);
      setSelected(res.order);
      setTracking({
        courierName: res.order.courierName ?? "",
        trackingNumber: res.order.trackingNumber ?? "",
        trackingUrl: res.order.trackingUrl ?? "",
      });
    } catch { /* ignore */ }
  }

  async function updateOrder(patch: Record<string, unknown>, msg?: string) {
    if (!selected) return;
    try {
      const res = await api<{ order: AdminOrder }>(`/admin/orders/${selected.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setSelected(res.order);
      setTracking({
        courierName: res.order.courierName ?? "",
        trackingNumber: res.order.trackingNumber ?? "",
        trackingUrl: res.order.trackingUrl ?? "",
      });
      setShipForm(false);
      toast.success(msg ?? `Order ${res.order.orderNumber} updated`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function saveTracking() {
    await updateOrder(
      {
        status: selected!.status === "CONFIRMED" ? "SHIPPED" : selected!.status,
        courierName: tracking.courierName,
        trackingNumber: tracking.trackingNumber,
        trackingUrl: tracking.trackingUrl,
      },
      tracking.trackingNumber ? `Shipped via ${tracking.courierName || "courier"}` : "Tracking updated"
    );
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
                      onClick={() => {
                        setSelected(o);
                        setTracking({
                          courierName: o.courierName ?? "",
                          trackingNumber: o.trackingNumber ?? "",
                          trackingUrl: o.trackingUrl ?? "",
                        });
                        setShipForm(false);
                      }}
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
                      <td className="p-3">
                        <StatusBadge status={o.status} />
                        {o.status === "SHIPPED" && o.trackingNumber && (
                          <p className="mt-1 text-[10px] text-muted-foreground">{o.courierName} · {o.trackingNumber}</p>
                        )}
                      </td>
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetTitle className="mb-4">Order {selected?.orderNumber}</SheetTitle>
          {selected && (
            <div className="space-y-5 text-sm">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selected.status} />
                <StatusBadge status={selected.paymentMethod} />
                <StatusBadge status={selected.paymentStatus} />
              </div>
              <div className="text-xs text-muted-foreground">
                Placed {formatDateTime(selected.createdAt)}
                {selected.paymentId && <> · Payment ID <span className="font-mono">{selected.paymentId}</span></>}
              </div>

              {/* Order journey stepper */}
              {selected.status !== "CANCELLED" ? (
                <div className="rounded-xl border p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Order journey</p>
                  <div className="flex items-start">
                    {JOURNEY.map((step, i) => {
                      const idx = JOURNEY.findIndex((j) => j.key === selected.status);
                      const done = i <= idx;
                      const current = i === idx;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex flex-1 items-start last:flex-none">
                          <div className="flex flex-col items-center">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${done ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"} ${current ? "ring-4 ring-primary/20" : ""}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className={`mt-1.5 text-[10px] font-semibold ${done ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
                            {step.key === "PLACED" && selected.createdAt && (
                              <span className="text-[9px] text-muted-foreground">{formatDateTime(selected.createdAt)}</span>
                            )}
                            {step.key === "CONFIRMED" && selected.confirmedAt && (
                              <span className="text-[9px] text-muted-foreground">{formatDateTime(selected.confirmedAt)}</span>
                            )}
                            {step.key === "SHIPPED" && selected.shippedAt && (
                              <span className="text-[9px] text-muted-foreground">{formatDateTime(selected.shippedAt)}</span>
                            )}
                            {step.key === "DELIVERED" && selected.deliveredAt && (
                              <span className="text-[9px] text-muted-foreground">{formatDateTime(selected.deliveredAt)}</span>
                            )}
                          </div>
                          {i < JOURNEY.length - 1 && (
                            <div className={`mx-1 mt-4 h-0.5 flex-1 ${i < idx ? "bg-primary" : "bg-muted"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
                  <XCircle className="mx-auto mb-1 h-5 w-5 text-destructive" />
                  <p className="text-sm font-semibold text-destructive">This order was cancelled</p>
                  {selected.cancelledAt && <p className="text-xs text-muted-foreground">{formatDateTime(selected.cancelledAt)}</p>}
                </div>
              )}

              {/* Context-aware actions */}
              {selected.status !== "CANCELLED" && selected.status !== "DELIVERED" && (
                <div className="space-y-2">
                  {selected.status === "PLACED" && (
                    <Button className="w-full gap-2" onClick={() => updateOrder({ status: "CONFIRMED" }, "Order confirmed — ready to pack")}>
                      <CheckCircle2 className="h-4 w-4" /> Confirm Order
                    </Button>
                  )}
                  {selected.status === "CONFIRMED" && (
                    <Button className="w-full gap-2" onClick={() => setShipForm((v) => !v)}>
                      <Ship className="h-4 w-4" /> Mark as Shipped
                    </Button>
                  )}
                  {selected.status === "SHIPPED" && (
                    <>
                      <Button className="w-full gap-2" onClick={() => updateOrder({ status: "DELIVERED" }, "Order delivered")}>
                        <PackageCheck className="h-4 w-4" /> Mark as Delivered
                      </Button>
                      <Button variant="outline" className="w-full gap-2" onClick={() => setShipForm((v) => !v)}>
                        <Truck className="h-4 w-4" /> Edit Tracking
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => updateOrder({ status: "CANCELLED" }, "Order cancelled — stock restored")}
                  >
                    <XCircle className="h-4 w-4" /> Cancel Order
                  </Button>
                </div>
              )}

              {/* Ship / tracking form */}
              {shipForm && (selected.status === "CONFIRMED" || selected.status === "SHIPPED") && (
                <div className="space-y-3 rounded-xl border border-dashed p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {selected.status === "CONFIRMED" ? "Dispatch details" : "Update tracking"}
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Courier partner</Label>
                    <Select value={tracking.courierName || "Other"} onValueChange={(v) => setTracking((t) => ({ ...t, courierName: v === "Other" ? "" : v }))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select courier" /></SelectTrigger>
                      <SelectContent>
                        {COURIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tracking / AWB number</Label>
                    <Input
                      value={tracking.trackingNumber}
                      onChange={(e) => setTracking((t) => ({ ...t, trackingNumber: e.target.value }))}
                      placeholder="e.g. 1234567890"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tracking URL (optional — auto-built from courier + AWB)</Label>
                    <Input
                      value={tracking.trackingUrl}
                      onChange={(e) => setTracking((t) => ({ ...t, trackingUrl: e.target.value }))}
                      placeholder="https://…"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={saveTracking} disabled={!tracking.trackingNumber}>
                      {selected.status === "CONFIRMED" ? "Ship Order" : "Save Tracking"}
                    </Button>
                    <Button variant="outline" onClick={() => setShipForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Tracking info display */}
              {selected.trackingNumber && !shipForm && (
                <div className="rounded-xl border p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Shipment tracking</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Courier</span><span className="font-medium">{selected.courierName ?? "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">AWB</span><span className="font-mono">{selected.trackingNumber}</span></div>
                    {selected.shippedAt && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Shipped</span><span>{formatDateTime(selected.shippedAt)}</span></div>
                    )}
                  </div>
                  {selected.trackingUrl && (
                    <a href={selected.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-2 text-xs font-semibold hover:bg-muted">
                      <ExternalLink className="h-3.5 w-3.5" /> Track on courier website
                    </a>
                  )}
                </div>
              )}

              {/* Payment status override */}
              {selected.status !== "CANCELLED" && (
                <div className="space-y-2 rounded-xl border p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Payment status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PAYMENT_STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selected.paymentStatus === s ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => updateOrder({ paymentStatus: s }, `Payment marked ${s}`)}
                        disabled={selected.paymentStatus === s}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Audit timeline */}
              {selected.events && selected.events.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Activity log</p>
                  <div className="space-y-2.5">
                    {selected.events.map((ev: OrderEvent) => {
                      const meta = EVENT_LABEL[ev.type] ?? EVENT_LABEL.NOTE;
                      return (
                        <div key={ev.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <span className="w-px flex-1 bg-border" />
                          </div>
                          <div className="pb-1">
                            <p className="text-xs">
                              <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                              {ev.value && <> · {ev.value}</>}
                            </p>
                            {ev.note && <p className="text-xs text-muted-foreground">{ev.note}</p>}
                            <p className="text-[10px] text-muted-foreground">
                              {formatDateTime(ev.createdAt)} · {ev.createdBy ?? "system"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
