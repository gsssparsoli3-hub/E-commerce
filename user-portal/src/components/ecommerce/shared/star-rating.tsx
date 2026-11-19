"use client";

import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  size = 14,
  className,
}: {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className={cn("flex items-center gap-1", className)}>
      <span className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
        {stars.map((i) => {
          const full = rating >= i;
          const half = !full && rating >= i - 0.5;
          return (
            <span key={i} className="relative inline-block">
              <Star size={size} className="text-muted-foreground/30" />
              {(full || half) && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: full ? "100%" : "50%" }}>
                  {half ? (
                    <StarHalf size={size} className="fill-amber-400 text-amber-400" />
                  ) : (
                    <Star size={size} className="fill-amber-400 text-amber-400" />
                  )}
                </span>
              )}
            </span>
          );
        })}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </span>
  );
}
