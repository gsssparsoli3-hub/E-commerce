"use client";

import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/format";
import type { CartItem, SiteSettings } from "@/types";

/** Sticky order summary card — item list, totals, place-order button. */
export function OrderSummary({
  items,
  subtotal,
  discount,
  shipping,
  total,
  couponCode,
  paymentMethod,
  placing,
  disabled,
  onPlace,
}: {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string | null;
  paymentMethod: "COD" | "RAZORPAY";
  placing: boolean;
  disabled: boolean;
  onPlace: () => void;
}) {
  return (
    <Card className="sticky top-36 lg:col-span-2">
      <CardContent className="space-y-4 p-5">
        <h2 className="font-bold">Your Order ({items.length} items)</h2>
        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <img src={item.product.images[0]} alt="" className="h-12 w-12 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold">{formatINR(item.product.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Coupon ({couponCode})</span>
              <span>−{formatINR(discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
          </div>
        </div>
        <Separator />
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{formatINR(total)}</span>
        </div>
        <Button size="lg" className="w-full rounded-full" disabled={disabled} onClick={onPlace}>
          {placing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</>
          ) : paymentMethod === "RAZORPAY" ? (
            <><CreditCard className="h-4 w-4" /> Pay {formatINR(total)}</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" /> Place Order</>
          )}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          By placing this order you agree to our terms & refund policy.
        </p>
      </CardContent>
    </Card>
  );
}

/** Compute shipping based on settings + subtotal. */
export function computeShipping(subtotal: number, settings: SiteSettings | null): number {
  if (!settings) return 0;
  if (subtotal === 0) return 0;
  if (settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove) return 0;
  return settings.shippingFee;
}

/** Safe discount — capped at subtotal so total never goes negative. */
export function computeDiscount(coupon: { discount: number } | null, subtotal: number): number {
  return coupon && coupon.discount <= subtotal ? coupon.discount : 0;
}
