"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuantityStepper({
  value,
  onChange,
  max = 10,
  min = 1,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
  size?: "sm" | "md";
}) {
  const btn = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <div className="inline-flex items-center rounded-full border bg-background" role="group" aria-label="Quantity">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`${btn} rounded-l-full rounded-r-none`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className={`min-w-8 text-center text-sm font-semibold ${size === "sm" ? "min-w-6" : ""}`} aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`${btn} rounded-r-full rounded-l-none`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
