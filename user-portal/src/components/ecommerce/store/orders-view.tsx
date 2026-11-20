"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Download, ExternalLink, Package, RotateCcw, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared/empty-state";
import { StatusBadge } from "../shared/status-badge";
import { api } from "@/lib/client-api";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useUiStore } from "@/stores/ui";
import { useRouterStore } from "@/stores/router";
import { formatINR, formatDateTime } from "@/lib/format";
import type { Order } from "@/types";

const TIMELINE = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

export function OrdersView() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const openAuth = useUiStore((s) => s.openAuth);
  const add = useCartStore((s) => s.add);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api<{ orders: Order[] }>("/orders")
      .then((r) => setOrders(r.orders))
      .catch(() => setOrders([]));
  }, [user]);

  async function cancelOrder(order: Order) {
    try {
      await api(`/orders/${order.id}`, { method: "PATCH" });
      setOrders((prev) =>
        prev!.map((o) => (o.id === order.id ? { ...o, status: "CANCELLED" } : o))
      );
      toast.success("Order cancelled", { description: order.orderNumber });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel order");
    }
  }

  // Reorder — add every item from a past order back into the cart
  async function reorder(order: Order) {
    let okCount = 0;
    for (const item of order.items) {
      const ok = await add(item.productId, item.quantity);
      if (ok) okCount++;
    }
    if (okCount === order.items.length) {
      toast.success("Added all items to cart", { description: `${okCount} items from ${order.orderNumber}` });
      navigate("/cart");
    } else if (okCount > 0) {
      toast.info(`${okCount} of ${order.items.length} items added`, { description: "Some items may be out of stock" });
      navigate("/cart");
    } else {
      toast.error("Could not add items — they may be out of stock");
    }
  }

  function downloadInvoice(order: Order) {
    window.open(`/api/orders/${order.orderNumber}/invoice`, "_blank");
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={Package}
          title="Sign in to view your orders"
          description="Track all your orders in one place."
          actionLabel="Sign in"
          onAction={() => openAuth("login")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-3 py-5 sm:px-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">My Orders</h1>

      {orders === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place orders they'll show up here."
          actionLabel="Start shopping"
          onAction={() => navigate("/shop")}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isOpen = expanded === order.id;
            const timelineIdx = TIMELINE.indexOf(order.status);
            return (
              <div key={order.id} className="overflow-hidden rounded-xl border bg-card">
                {/* Header */}
                <button
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left hover:bg-muted/40"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.paymentMethod} />
                    <StatusBadge status={order.paymentStatus} />
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-bold">{formatINR(order.total)}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t bg-muted/20 p-4">
                    {/* Timeline */}
                    {order.status !== "CANCELLED" ? (
                      <div className="mb-4 flex items-center" aria-label="Order progress">
                        {TIMELINE.map((step, i) => (
                          <div key={step} className="flex flex-1 items-center last:flex-none">
                            <div className="flex flex-col items-center">
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                                  i <= timelineIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {i + 1}
                              </span>
                              <span className={`mt-1 text-[10px] font-medium ${i <= timelineIdx ? "text-primary" : "text-muted-foreground"}`}>
                                {step}
                              </span>
                            </div>
                            {i < TIMELINE.length - 1 && (
                              <div className={`mx-1 mb-4 h-0.5 flex-1 ${i < timelineIdx ? "bg-primary" : "bg-muted"}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mb-4 rounded-lg bg-red-50 p-2 text-center text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
                        This order was cancelled {order.paymentStatus === "REFUNDED" && "— refund initiated to your payment method"}
                      </p>
                    )}

                    {/* Items */}
                    <div className="space-y-2.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img src={item.image} alt="" className="h-12 w-12 rounded-md object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                          </div>
                          <span className="text-sm font-semibold">{formatINR(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Address + totals */}
                    <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                      {order.address && (
                        <div>
                          <p className="font-semibold text-foreground">Delivery address</p>
                          <p>{order.address.fullName}, {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city}, {order.address.state} — {order.address.pincode}</p>
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
                        {order.discount > 0 && <div className="flex justify-between"><span>Coupon ({order.couponCode})</span><span>−{formatINR(order.discount)}</span></div>}
                        <div className="flex justify-between"><span>Shipping</span><span>{order.shipping === 0 ? "FREE" : formatINR(order.shipping)}</span></div>
                        <div className="flex justify-between font-bold text-foreground"><span>Total</span><span>{formatINR(order.total)}</span></div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => reorder(order)}>
                        <RotateCcw className="h-4 w-4" /> Reorder
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadInvoice(order)}>
                        <Download className="h-4 w-4" /> Invoice
                      </Button>
                      {(order.status === "PLACED" || order.status === "CONFIRMED") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => cancelOrder(order)}
                        >
                          <XCircle className="h-4 w-4" /> Cancel
                        </Button>
                      )}
                    </div>

                    {/* Tracking link for shipped / out-for-delivery orders */}
                    {(order.status === "SHIPPED" || order.status === "DELIVERED") && order.trackingNumber && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <Truck className="h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold">
                            {order.courierName ? `Shipped via ${order.courierName}` : "Shipped"}
                            <span className="ml-1 font-mono text-muted-foreground">· {order.trackingNumber}</span>
                          </p>
                          {order.shippedAt && (
                            <p className="text-[11px] text-muted-foreground">Dispatched {formatDateTime(order.shippedAt)}</p>
                          )}
                        </div>
                        {order.trackingUrl && (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                          >
                            <ExternalLink className="h-3 w-3" /> Track
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
