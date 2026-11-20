"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Headphones, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Price } from "../shared/price";
import { api } from "@/lib/client-api";
import { SectionHeader } from "../shared/section-header";
import { ProductCard } from "../shared/product-card";
import { HeroCarousel } from "./hero-carousel";
import { useRouterStore } from "@/stores/router";
import { useRecentlyViewedStore, type RecentProduct } from "@/stores/recently-viewed";
import type { Banner, Category, Product } from "@/types";

const TRUST_ITEMS = [
  { icon: Truck, title: "Free Shipping", text: "On orders above ₹999" },
  { icon: ShieldCheck, title: "Secure Payments", text: "100% protected checkout" },
  { icon: PackageCheck, title: "Easy Returns", text: "7-day hassle-free returns" },
  { icon: Headphones, title: "Top Support", text: "We reply within hours" },
];

export function HomeView() {
  const navigate = useRouterStore((s) => s.navigate);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const recent = useRecentlyViewedStore((s) => s.items);
  const hydrateRecent = useRecentlyViewedStore((s) => s.hydrate);

  useEffect(() => {
    hydrateRecent();
    Promise.all([
      api<{ banners: Banner[] }>("/banners?position=HERO"),
      api<{ categories: Category[] }>("/categories"),
      api<{ products: Product[] }>("/products?featured=1&limit=8"),
      api<{ products: Product[] }>("/products?sort=popular&limit=8"),
    ])
      .then(([b, c, f, p]) => {
        setBanners(b.banners);
        setCategories(c.categories);
        setFeatured(f.products);
        setBestsellers(p.products);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [hydrateRecent]);

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-3 py-5 sm:px-6 sm:py-8">
      {loading ? (
        <div className="space-y-10">
          <Skeleton className="aspect-[21/8] w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          <HeroCarousel banners={banners} />

          {/* Trust strip */}
          <section aria-label="Why shop with us" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {TRUST_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-tight">{item.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Categories */}
          {categories.length > 0 && (
            <section aria-labelledby="categories-heading">
              <div id="categories-heading"><SectionHeader title="Shop by Category" viewAllHref="/shop" /></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/shop?category=${c.slug}`)}
                    className="group overflow-hidden rounded-xl border bg-card text-left transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <Image
                        src={c.image ?? "/brand/logo.png"}
                        alt={c.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-sm font-semibold group-hover:text-primary">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.productCount} products</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Featured */}
          {featured.length > 0 && (
            <section aria-labelledby="featured-heading">
              <div id="featured-heading">
                <SectionHeader title="Featured Picks" subtitle="Hand-picked favourites from our catalog" viewAllHref="/shop" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                {featured.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}

          {/* Best sellers */}
          {bestsellers.length > 0 && (
            <section aria-labelledby="bestsellers-heading">
              <div id="bestsellers-heading">
                <SectionHeader title="Best Sellers" subtitle="What everyone is buying right now" viewAllHref="/shop?sort=popular" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                {bestsellers.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}

          {/* Recently viewed (localStorage — no API, instant) */}
          {recent.length > 0 && (
            <section aria-labelledby="recent-heading">
              <div id="recent-heading">
                <SectionHeader title="Recently Viewed" subtitle="Pick up where you left off" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                {recent.slice(0, 4).map((p: RecentProduct) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/product/${p.slug}`)}
                    className="group overflow-hidden rounded-xl border bg-card text-left transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <Image
                        src={p.image || "/brand/logo.png"}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">{p.name}</p>
                      <Price price={p.price} mrp={p.mrp} size="sm" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
