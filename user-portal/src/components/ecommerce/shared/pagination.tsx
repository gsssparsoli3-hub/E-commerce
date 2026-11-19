"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  const window: number[] = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  for (let i = start; i <= Math.min(pages, start + 4); i++) window.push(i);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <Button variant="outline" size="icon" className="h-9 w-9" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {start > 1 && <span className="px-1 text-sm text-muted-foreground">…</span>}
      {window.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="icon"
          className="h-9 w-9"
          onClick={() => onChange(p)}
          aria-label={`Page ${p}`}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </Button>
      ))}
      {start + 4 < pages && <span className="px-1 text-sm text-muted-foreground">…</span>}
      <Button variant="outline" size="icon" className="h-9 w-9" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
