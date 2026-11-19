"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared/empty-state";
import { QuantityStepper } from "../shared/quantity-stepper";
import { Price } from "../shared/price";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useUiStore } from "@/stores/ui";
import { useRouterStore } from "@/stores/router";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/format";

export function CartView() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const openAuth = useUiStore((s) => s.openAuth);
  const { items, loading, setQuantity, remove, coupon: activeCoupon, setCoupon } = useCartStore();
  const settings = useSettingsStore((s) => s.settings);
  const couponsEnabled = settings?.couponsEnabled ?? true;

  const [couponInput, setCouponInput] = useState("");

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = !settings ? 0 : (settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove ? 0 : subtotal > 0 ? settings.shippingFee : 0);
  const discount = activeCoupon && activeCoupon.discount <= subtotal ? activeCoupon.discount : 0;
  const total = subtotal - discount + shipping;

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={ShoppingCart}
          title="Sign in to see your cart"
          description="Your cart syncs across devices once you sign in."
          actionLabel="Sign in"
          onAction={() => openAuth("login")}
        />
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-3 py-6 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">
        Shopping Cart <span className="text-base font-medium text-muted-foreground">({items.length} items)</span>
      </h1>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Explore our latest collections!"
          actionLabel="Start shopping"
          onAction={() => navigate("/shop")}
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          {/* Items */}
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="flex gap-4 p-3 sm:p-4">
                  <button
                    onClick={() => navigate(`/product/${item.product.slug}`)}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24"
                    aria-label={`View ${item.product.name}`}
                  >
                    <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                    <div>
                      <button
                        onClick={() => navigate(`/product/${item.product.slug}`)}
                        className="line-clamp-2 text-left text-sm font-semibold leading-5 hover:text-primary sm:text-[15px]"
                      >
                        {item.product.name}
                      </button>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.product.category.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          max={Math.min(10, item.product.stock)}
                          onChange={(v) => setQuantity(item.id, v)}
                        />
                        <button
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => remove(item.id)}
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                      <Price price={item.product.price * item.quantity} mrp={item.product.mrp * item.quantity} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <Card className="sticky top-36">
            <CardContent className="space-y-4 p-5">
              <h2 className="font-bold">Order Summary</h2>

              {couponsEnabled && (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="h-9"
                      aria-label="Coupon code"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9"
                      disabled={!couponInput.trim()}
                      onClick={async () => {
                        try {
                          const res = await api<{ code: string; discount: number }>("/coupons/validate", {
                            method: "POST",
                            body: JSON.stringify({ code: couponInput, subtotal }),
                          });
                          setCoupon(res);
                          toast.success(`Coupon ${res.code} applied — you save ${formatINR(res.discount)}`);
                        } catch (error) {
                          setCoupon(null);
                          toast.error(error instanceof Error ? error.message : "Invalid coupon");
                        }
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                  {activeCoupon && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {activeCoupon.code} applied: −{formatINR(activeCoupon.discount)}
                    </p>
                  )}
                </>
              )}

              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatINR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Coupon discount</span>
                    <span>−{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
                </div>
                {shipping > 0 && settings?.freeShippingAbove ? (
                  <p className="text-xs text-muted-foreground">
                    Add {formatINR(settings.freeShippingAbove - subtotal)} more for free shipping
                  </p>
                ) : null}
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
              <Button size="lg" className="w-full rounded-full" onClick={() => navigate("/checkout")}>
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="w-full text-sm" onClick={() => navigate("/shop")}>
                Continue shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
