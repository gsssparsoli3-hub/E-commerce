"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // order statuses
  PLACED: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  CONFIRMED: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  SHIPPED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  // payment statuses
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  REFUNDED: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  // product/user
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  DRAFT: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  ARCHIVED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  HIDDEN: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  BLOCKED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  DISABLED: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const LABELS: Record<string, string> = {
  PLACED: "Placed", CONFIRMED: "Confirmed", SHIPPED: "Shipped", DELIVERED: "Delivered",
  CANCELLED: "Cancelled", PAID: "Paid", PENDING: "Pending", FAILED: "Failed",
  REFUNDED: "Refunded", ACTIVE: "Active", DRAFT: "Draft", ARCHIVED: "Archived",
  HIDDEN: "Hidden", BLOCKED: "Blocked", DISABLED: "Disabled",
  COD: "COD", RAZORPAY: "Razorpay",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("font-medium capitalize", STATUS_STYLES[status] ?? "", className)}>
      {LABELS[status] ?? status.toLowerCase()}
    </Badge>
  );
}
