"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { useRouterStore } from "@/stores/router";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/format";

type Suggestion = {
  products: { id: string; name: string; slug: string; price: number; image: string }[];
  categories: { id: string; name: string; slug: string; image: string | null }[];
};

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
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useRouterStore((s) => s.navigate);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setSuggestions(null); return; }
    const t = setTimeout(() => {
      api<Suggestion>(`/products/suggest?q=${encodeURIComponent(q)}`)
        .then(setSuggestions)
        .catch(() => setSuggestions(null));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setOpen(false);
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop");
  }

  const hasResults = suggestions && (suggestions.products.length > 0 || suggestions.categories.length > 0);

  return (
    <div ref={boxRef} className="relative w-full">
      <form role="search" onSubmit={submit} aria-label="Search products">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Search products"
          className="h-10 w-full rounded-full border bg-muted/60 pl-10 pr-9 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-ring/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSuggestions(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Autocomplete dropdown */}
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-96 overflow-y-auto rounded-xl border bg-popover shadow-xl">
          {!suggestions ? (
            <div className="p-3 text-center text-xs text-muted-foreground">Searching…</div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No matches for &ldquo;{query}&rdquo;. Press Enter to search all products.
            </div>
          ) : (
            <div className="py-1">
              {suggestions.categories.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Categories</p>
                  {suggestions.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setOpen(false); navigate(`/shop?category=${c.slug}`); }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/60"
                    >
                      {c.image && (
                        <Image src={c.image} alt="" width={32} height={32} className="h-8 w-8 rounded-md object-cover" />
                      )}
                      <span className="font-medium">{c.name}</span>
                    </button>
                  ))}
                </>
              )}
              {suggestions.products.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Products</p>
                  {suggestions.products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setOpen(false); navigate(`/product/${p.slug}`); }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/60"
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                        {p.image && <Image src={p.image} alt={p.name} fill sizes="44px" className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{formatINR(p.price)}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              <button
                type="button"
                onClick={submit as never}
                className="block w-full border-t px-3 py-2.5 text-center text-xs font-semibold text-primary hover:bg-muted/60"
              >
                See all results for &ldquo;{query}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
