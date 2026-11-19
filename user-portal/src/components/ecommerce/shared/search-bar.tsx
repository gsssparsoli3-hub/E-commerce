"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useRouterStore } from "@/stores/router";

export function SearchBar({
  initialQuery = "",
  placeholder = "Search products, brands and more…",
  autoFocus = false,
}: {
  initialQuery?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useRouterStore((s) => s.navigate);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className="relative w-full"
      aria-label="Search products"
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className="h-10 w-full rounded-full border bg-muted/60 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-ring/30"
      />
      {query && (
        <Link
          href={`#/shop?search=${encodeURIComponent(query)}`}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Search
        </Link>
      )}
    </form>
  );
}
