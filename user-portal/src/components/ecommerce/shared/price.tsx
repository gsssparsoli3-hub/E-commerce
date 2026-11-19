"use client";

import { formatINR, discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  price,
  mrp,
  size = "md",
  className,
}: {
  price: number;
  mrp?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const off = mrp ? discountPercent(mrp, price) : 0;
  return (
    <span className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-bold tracking-tight",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl sm:text-3xl"
        )}
      >
        {formatINR(price)}
      </span>
      {mrp && mrp > price ? (
        <>
          <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-base" : "text-xs")}>
            {formatINR(mrp)}
          </span>
          <span
            className={cn(
              "font-semibold text-emerald-600 dark:text-emerald-400",
              size === "lg" ? "text-sm" : "text-xs"
            )}
          >
            {off}% off
          </span>
        </>
      ) : null}
    </span>
  );
}
