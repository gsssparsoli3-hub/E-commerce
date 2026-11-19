"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, PackageSearch, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../shared/empty-state";
import { Pagination } from "../shared/pagination";
import { ProductCard } from "../shared/product-card";
import { api } from "@/lib/client-api";
import { useRouterStore } from "@/stores/router";
import { useRoute } from "@/stores/router";
import type { Category, Product } from "@/types";

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "discount", label: "Biggest discount" },
];

const PRICE_BUCKETS = [
  { label: "Under ₹500", min: 0, max: 50000 },
  { label: "₹500 – ₹1,500", min: 50000, max: 150000 },
  { label: "₹1,500 – ₹3,000", min: 150000, max: 300000 },
  { label: "Above ₹3,000", min: 300000, max: 0 },
];

export function ShopView() {
  const navigate = useRouterStore((s) => s.navigate);
  const { query } = useRoute();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state (source of truth = URL query)
  const category = query.get("category") ?? "";
  const search = query.get("search") ?? "";
  const sort = query.get("sort") ?? "newest";
  const minPrice = Number(query.get("minPrice")) || 0;
  const maxPrice = Number(query.get("maxPrice")) || 0;
  const minRating = Number(query.get("minRating")) || 0;
  const inStock = query.get("inStock") === "1";
  const page = Number(query.get("page")) || 1;

  useEffect(() => {
    api<{ categories: Category[] }>("/categories").then((r) => setCategories(r.categories)).catch(() => null);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    if (minPrice) params.set("minPrice", String(minPrice));
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    if (minRating) params.set("minRating", String(minRating));
    if (inStock) params.set("inStock", "1");
    params.set("page", String(page));
    params.set("limit", "12");
    try {
      const res = await api<{ products: Product[]; pagination: typeof pagination }>(`/products?${params}`);
      setProducts(res.products);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, minPrice, maxPrice, minRating, inStock, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    if (key !== "page") params.delete("page");
    navigate(`/shop${params.toString() ? `?${params}` : ""}`);
  };

  const activeFilterCount = [category, minPrice, maxPrice, minRating, inStock].filter(Boolean).length;
  const activeCategory = categories.find((c) => c.slug === category);

  const Filters = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="mb-2.5 text-sm font-bold">Category</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => setParam("category", null)}
            className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${!category ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"}`}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam("category", c.slug)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
                category === c.slug ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"
              }`}
            >
              {c.name}
              <span className="text-xs text-muted-foreground">{c.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-2.5 text-sm font-bold">Price</h3>
        <RadioGroup
          value={minPrice || maxPrice ? `${minPrice}-${maxPrice}` : "any"}
          onValueChange={(v) => {
            if (v === "any") { setParam("minPrice", null); setParam("maxPrice", null); }
            else {
              const [min, max] = v.split("-").map(Number);
              setParam("minPrice", min ? String(min) : null);
              setParam("maxPrice", max ? String(max) : null);
            }
          }}
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="any" id="price-any" />
            <Label htmlFor="price-any" className="text-sm font-normal">Any price</Label>
          </div>
          {PRICE_BUCKETS.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <RadioGroupItem value={`${b.min}-${b.max}`} id={`price-${b.min}-${b.max}`} />
              <Label htmlFor={`price-${b.min}-${b.max}`} className="text-sm font-normal">{b.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Rating */}
      <div>
        <h3 className="mb-2.5 text-sm font-bold">Customer rating</h3>
        <RadioGroup value={minRating ? String(minRating) : "any"} onValueChange={(v) => setParam("minRating", v === "any" ? null : v)} className="gap-2">
          {["any", "4", "3"].map((r) => (
            <div key={r} className="flex items-center gap-2">
              <RadioGroupItem value={r} id={`rating-${r}`} />
              <Label htmlFor={`rating-${r}`} className="text-sm font-normal">
                {r === "any" ? "All ratings" : `${r}★ & above`}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Availability */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="in-stock"
          checked={inStock}
          onCheckedChange={(v) => setParam("inStock", v === true ? "1" : null)}
        />
        <Label htmlFor="in-stock" className="text-sm font-normal">In stock only</Label>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          onClick={() => navigate(search ? `/shop?search=${encodeURIComponent(search)}` : "/shop")}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
      {/* Heading */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {search ? `Results for "${search}"` : activeCategory ? activeCategory.name : "All Products"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {loading ? "Loading…" : `${pagination.total} product${pagination.total === 1 ? "" : "s"} found`}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-56 shrink-0 lg:block" aria-label="Product filters">
          {Filters}
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex items-center gap-2">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 lg:hidden">
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetTitle className="mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </SheetTitle>
                {Filters}
              </SheetContent>
            </Sheet>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:block">Sort by</span>
              <Select value={sort} onValueChange={(v) => setParam("sort", v === "newest" ? null : v)}>
                <SelectTrigger size="sm" className="h-9 w-44" aria-label="Sort products">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description="Try adjusting your filters or search for something else."
              actionLabel="Clear filters"
              onAction={() => navigate("/shop")}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <div className="mt-8">
                <Pagination
                  page={pagination.page}
                  pages={pagination.pages}
                  onChange={(p) => setParam("page", p === 1 ? null : String(p))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
