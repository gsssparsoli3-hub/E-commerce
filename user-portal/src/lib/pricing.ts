// Shared pricing logic for coupons, shipping and order totals (all amounts in paise).

export type CouponLike = {
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
};

export function computeDiscount(coupon: CouponLike, subtotal: number): number {
  if (subtotal < coupon.minOrder) return 0;
  let discount = coupon.type === "PERCENT" ? Math.floor((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.type === "PERCENT" && coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  return Math.min(discount, subtotal);
}

export function computeShipping(subtotal: number, shippingFee: number, freeAbove: number): number {
  if (freeAbove > 0 && subtotal >= freeAbove) return 0;
  return subtotal === 0 ? 0 : shippingFee;
}
