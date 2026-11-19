"use client";

import { ChevronRight } from "lucide-react";
import { useRouterStore } from "@/stores/router";

export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
}) {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <button
          onClick={() => navigate(viewAllHref)}
          className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
        >
          View all <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
