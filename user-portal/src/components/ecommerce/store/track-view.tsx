"use client";

import { useState } from "react";
import { Loader2, PackageSearch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "../shared/status-badge";
import { api } from "@/lib/client-api";
import { formatINR, formatDateTime } from "@/lib/format";

const TIMELINE = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

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
  items: { name: string; quantity: number; image: string; price: number }[];
};

/** Guest order tracking — no login needed, order number + email required. */
export function TrackView() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [form, setForm] = useState({ orderNumber: "", email: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

  const timelineIdx = order ? TIMELINE.indexOf(order.status) : -1;

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

            {/* Timeline */}
            {order.status !== "CANCELLED" ? (
              <div className="flex items-center" aria-label="Order progress">
                {TIMELINE.map((step, i) => (
                  <div key={step} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                          i <= timelineIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`mt-1 text-[10px] font-medium ${
                          i <= timelineIdx ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className={`mx-1 mb-5 h-0.5 flex-1 ${i < timelineIdx ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-red-50 p-2 text-center text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
                This order was cancelled
                {order.paymentStatus === "REFUNDED" && " — refund initiated to your payment method"}
              </p>
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

            <Button variant="outline" className="w-full gap-1.5" onClick={handleSubmit as never} disabled={busy}>
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Refresh status
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
