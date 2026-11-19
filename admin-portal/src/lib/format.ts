/** Format an amount stored in paise to Indian Rupee display, e.g. 129900 -> ₹1,299 */
export function formatINR(paise: number, withDecimals = false): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(rupees);
}

export function discountPercent(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const ORDER_STATUSES = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
