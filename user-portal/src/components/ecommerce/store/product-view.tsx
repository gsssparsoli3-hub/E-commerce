"use client";

import { useEffect, useState } from "react";
import { Heart, Minus, Package, RefreshCcw, ShieldCheck, ShoppingCart, Truck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Price } from "../shared/price";
import { StarRating } from "../shared/star-rating";
import { QuantityStepper } from "../shared/quantity-stepper";
import { ProductCard } from "../shared/product-card";
import { SectionHeader } from "../shared/section-header";
import { ReviewSection } from "./review-section";
import { api } from "@/lib/client-api";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useSettingsStore } from "@/stores/settings";
import { useRouterStore } from "@/stores/router";
import { useDocumentTitle } from "@/hooks/use-document-title";
import type { Product, Review } from "@/types";

export function ProductView({ slug }: { slug: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  const addToCart = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlistEnabled = useSettingsStore((s) => s.settings?.wishlistEnabled ?? true);
  const reviewsEnabled = useSettingsStore((s) => s.settings?.reviewsEnabled ?? true);

  // Data for the current slug is kept together so `loading` can be derived
  // (no setState needed in the effect body).
  type ProductData = { forSlug: string; product: Product | null; related: Product[] };
  const [data, setData] = useState<ProductData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const loading = !data || data.forSlug !== slug;
  const product = !loading ? data.product : null;
  const related = !loading ? data.related : [];
  const wished = useWishlistStore((s) => s.ids.includes(product?.id ?? ""));
  useDocumentTitle(product ? product.name : null);

  useEffect(() => {
    let cancelled = false;
    api<{ product: Product; related: Product[] }>(`/products/${slug}`)
      .then(async (res) => {
        if (cancelled) return;
        setData({ forSlug: slug, product: res.product, related: res.related });
        setQuantity(1);
        setActiveImage(0);
        if (reviewsEnabled) {
          const r = await api<{ reviews: Review[] }>(`/reviews?productId=${res.product.id}`).catch(() => ({ reviews: [] as Review[] }));
          if (!cancelled) setReviews(r.reviews);
        }
      })
      .catch(() => {
        if (!cancelled) setData({ forSlug: slug, product: null, related: [] });
      });
    return () => { cancelled = true; };
  }, [slug, reviewsEnabled]);

  // Product JSON-LD for SEO
  useEffect(() => {
    if (!product) return;
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: product.images,
      description: product.description,
      sku: product.sku,
      brand: { "@type": "Brand", name: product.category.name },
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: (product.price / 100).toFixed(2),
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
      ...(product.reviewCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.rating,
              reviewCount: product.reviewCount,
            },
          }
        : {}),
    });
    document.head.appendChild(ld);
    return () => { ld.remove(); };
  }, [product]);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-3 py-6 sm:px-6 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Button className="mt-4" onClick={() => navigate("/shop")}>Back to shop</Button>
      </div>
    );
  }

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <button onClick={() => navigate("/")} className="hover:text-foreground">Home</button>
        <span className="mx-1.5">/</span>
        <button onClick={() => navigate(`/shop?category=${product.category.slug}`)} className="hover:text-foreground">
          {product.category.name}
        </button>
        <span className="mx-1.5">/</span>
        <span className="line-clamp-1 inline-block text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
            <img
              src={product.images[activeImage] ?? product.images[0]}
              alt={`${product.name} — image ${activeImage + 1}`}
              className="h-full w-full object-cover"
            />
            {discount > 0 && (
              <Badge className="absolute left-3 top-3 bg-emerald-600 text-sm font-bold hover:bg-emerald-600">
                {discount}% OFF
              </Badge>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2" role="tablist" aria-label="Product images">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === activeImage}
                  aria-label={`Image ${i + 1}`}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === activeImage ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{product.category.name}</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            {product.reviewCount > 0 && (
              <button className="mt-2 flex items-center gap-2" onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })}>
                <StarRating rating={product.rating} count={product.reviewCount} />
              </button>
            )}
          </div>

          <Price price={product.price} mrp={product.mrp} size="lg" />
          <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>

          <Separator />

          {/* Stock + quantity */}
          <div className="flex flex-wrap items-center gap-4">
            {product.stock > 0 ? (
              <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Package className="h-3 w-3" /> {product.stock} in stock
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                Out of stock
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{product.soldCount}+ sold</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Qty</span>
            <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, Math.min(10, product.stock))} />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1 rounded-full text-base"
              disabled={product.stock === 0}
              onClick={async () => {
                const ok = await addToCart(product.id, quantity);
                if (ok) toast.success("Added to cart", { description: product.name });
              }}
            >
              <ShoppingCart className="h-5 w-5" /> Add to Cart
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="flex-1 rounded-full text-base"
              disabled={product.stock === 0}
              onClick={async () => {
                const ok = await addToCart(product.id, quantity);
                if (ok) navigate("/checkout");
              }}
            >
              <Zap className="h-5 w-5" /> Buy Now
            </Button>
            {wishlistEnabled && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-4"
                onClick={() => toggleWishlist(product.id)}
                aria-label="Toggle wishlist"
              >
                <Heart className={`h-5 w-5 ${wished ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            )}
          </div>

          {/* Perks */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border bg-muted/40 p-3 text-center">
            <div className="flex flex-col items-center gap-1 py-1">
              <Truck className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-medium leading-tight">Fast delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-1">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-medium leading-tight">Secure payment</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-1">
              <RefreshCcw className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-medium leading-tight">7-day returns</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="mb-2 text-base font-bold">Product details</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            {product.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[11px]">{t}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviewsEnabled && (
        <section id="reviews" className="mt-14">
          <ReviewSection
            productId={product.id}
            reviews={reviews}
            rating={product.rating}
            reviewCount={product.reviewCount}
            onReviewAdded={(r) => setReviews((prev) => [r, ...prev.filter((x) => x.id !== r.id)])}
          />
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeader title="You may also like" viewAllHref={`/shop?category=${product.category.slug}`} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
