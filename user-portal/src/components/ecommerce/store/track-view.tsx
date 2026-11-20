"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, MapPin, PackageCheck, PackageSearch, RefreshCw, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "../shared/status-badge";
import { api } from "@/lib/client-api";
import { formatINR, formatDateTime } from "@/lib/format";

const JOURNEY: { key: string; label: string; desc: string; icon: typeof PackageSearch }[] = [
  { key: "PLACED", label: "Order Placed", desc: "We've received your order", icon: PackageSearch },
  { key: "CONFIRMED", label: "Confirmed", desc: "Seller has confirmed the order", icon: CheckCircle2 },
  { key: "SHIPPED", label: "Shipped", desc: "On its way to you", icon: Truck },
  { key: "DELIVERED", label: "Delivered", desc: "Order delivered", icon: PackageCheck },
];

type TrackedOrder = {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  couponCode?: string | null;
  placedAt: string;
  updatedAt: string;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  items: { name: string; quantity: number; image: string; price: number }[];
  events?: { type: string; value: string | null; note: string | null; createdAt: string }[];
};

/** Estimated delivery = shippedAt + 4 days (display only). */
function estimateDelivery(shippedAt?: string | null, deliveredAt?: string | null): string | null {
  if (deliveredAt) return null; // already delivered — no need for ETA
  if (!shippedAt) return null;
  const eta = new Date(shippedAt);
  eta.setDate(eta.getDate() + 4);
  return eta.toISOString();
}

/** Guest order tracking — no login needed, order number + email required. */
export function TrackView() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [form, setForm] = useState({ orderNumber: "", email: "" });

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      const res = await api<{ order: TrackedOrder }>("/orders/track", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setOrder(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not track this order");
    } finally {
      setBusy(false);
    }
  }

  const timelineIdx = order ? JOURNEY.findIndex((j) => j.key === order.status) : -1;
  const eta = order ? estimateDelivery(order.shippedAt, order.deliveredAt) : null;

  return (
    <div className="mx-auto max-w-2xl px-3 py-5 sm:px-6 sm:py-8">
      <h1 className="mb-2 text-2xl font-extrabold tracking-tight">Track your order</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter your order number and the email you used at checkout — no sign-in needed.
      </p>

      {/* Search form */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="track-number">Order number</Label>
              <Input
                id="track-number"
                required
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                placeholder="SP-XXXXXXXX"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="track-email">Email</Label>
              <Input
                id="track-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <Button type="submit" size="lg" className="rounded-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
              Track
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Result */}
      {order && (
        <Card>
          <CardContent className="space-y-5 p-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-bold">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">Placed {formatDateTime(order.placedAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={order.paymentMethod} />
                <StatusBadge status={order.paymentStatus} />
                <StatusBadge status={order.status} />
              </div>
            </div>

            {/* Cancelled banner */}
            {order.status === "CANCELLED" ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
                <XCircle className="mx-auto mb-1 h-5 w-5 text-destructive" />
                <p className="text-sm font-semibold text-destructive">This order was cancelled</p>
                {order.cancelledAt && <p className="text-xs text-muted-foreground">{formatDateTime(order.cancelledAt)}</p>}
                {order.paymentStatus === "REFUNDED" && (
                  <p className="mt-1 text-xs text-muted-foreground">Refund initiated to your payment method</p>
                )}
              </div>
            ) : (
              <>
                {/* Vertical journey timeline */}
                <div className="space-y-1">
                  {JOURNEY.map((step, i) => {
                    const done = i <= timelineIdx;
                    const current = i === timelineIdx;
                    const Icon = step.icon;
                    const ts =
                      step.key === "PLACED" ? order.placedAt :
                      step.key === "CONFIRMED" ? order.confirmedAt :
                      step.key === "SHIPPED" ? order.shippedAt :
                      order.deliveredAt;
                    return (
                      <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${done ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"} ${current ? "ring-4 ring-primary/20" : ""}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          {i < JOURNEY.length - 1 && (
                            <span className={`my-1 w-0.5 flex-1 ${i < timelineIdx ? "bg-primary" : "bg-muted"}`} style={{ minHeight: 24 }} />
                          )}
                        </div>
                        <div className="pb-3 pt-1">
                          <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                          {ts && (
                            <p className="text-[11px] font-medium text-primary">{formatDateTime(ts)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ETA banner */}
                {eta && (
                  <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Estimated delivery</p>
                      <p className="text-xs text-muted-foreground">
                        Arriving by <span className="font-semibold text-primary">{formatDateTime(eta)}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Tracking card */}
                {order.trackingNumber && (
                  <div className="rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Shipment details</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      {order.courierName && (
                        <div className="flex justify-between"><span className="text-muted-foreground">Courier</span><span className="font-medium">{order.courierName}</span></div>
                      )}
                      <div className="flex justify-between"><span className="text-muted-foreground">Tracking no.</span><span className="font-mono">{order.trackingNumber}</span></div>
                      {order.shippedAt && (
                        <div className="flex justify-between"><span className="text-muted-foreground">Shipped on</span><span>{formatDateTime(order.shippedAt)}</span></div>
                      )}
                    </div>
                    {order.trackingUrl && (
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                        <ExternalLink className="h-3.5 w-3.5" /> Track shipment on courier website
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

            <Separator />

            {/* Items */}
            <div className="space-y-2.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={item.image} alt="" className="h-12 w-12 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatINR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Coupon {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>−{formatINR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping === 0 ? "FREE" : formatINR(order.shipping)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatINR(order.total)}</span>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Last updated {formatDateTime(order.updatedAt)}
            </p>

            <Button variant="outline" className="w-full gap-1.5" onClick={() => handleSubmit()} disabled={busy}>
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Refresh status
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
