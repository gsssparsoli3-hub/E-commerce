"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck, Banknote, ChevronDown, ChevronUp, Heart, Link2, MapPin, Package,
  RefreshCcw, ShieldCheck, ShoppingCart, Star, Truck, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Price } from "../shared/price";
import { StarRating } from "../shared/star-rating";
import { QuantityStepper } from "../shared/quantity-stepper";
import { ProductCard } from "../shared/product-card";
import { SectionHeader } from "../shared/section-header";
import { ProductGallery } from "./product-gallery";
import { PincodeChecker } from "./pincode-checker";
import { ReviewSection } from "./review-section";
import { api } from "@/lib/client-api";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useSettingsStore } from "@/stores/settings";
import { useRouterStore } from "@/stores/router";
import { useRecentlyViewedStore } from "@/stores/recently-viewed";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { formatINR } from "@/lib/format";
import type { Product, Review } from "@/types";

type FBTItem = { id: string; name: string; slug: string; price: number; mrp: number; image: string };

export function ProductView({ slug }: { slug: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  const addToCart = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const settings = useSettingsStore((s) => s.settings);
  const wishlistEnabled = settings?.wishlistEnabled ?? true;
  const reviewsEnabled = settings?.reviewsEnabled ?? true;
  const codEnabled = settings?.codEnabled ?? true;
  const addRecent = useRecentlyViewedStore((s) => s.add);

  type ProductData = {
    forSlug: string;
    product: Product | null;
    related: Product[];
    frequentlyBought: FBTItem[];
  };
  const [data, setData] = useState<ProductData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showEmi, setShowEmi] = useState(false);
  const [showSpecs, setShowSpecs] = useState(true);

  const loading = !data || data.forSlug !== slug;
  const product = !loading ? data.product : null;
  const related = !loading ? data.related : [];
  const fbt = !loading ? data.frequentlyBought : [];
  const wished = useWishlistStore((s) => s.ids.includes(product?.id ?? ""));
  useDocumentTitle(product ? product.name : null);

  useEffect(() => {
    let cancelled = false;
    api<{ product: Product; related: Product[]; reviews?: Review[]; frequentlyBought?: FBTItem[] }>(`/products/${slug}`)
      .then((res) => {
        if (cancelled) return;
        setData({ forSlug: slug, product: res.product, related: res.related, frequentlyBought: res.frequentlyBought ?? [] });
        setReviews(res.reviews ?? []);
        setQuantity(1);
        if (res.product) {
          const imgs = res.product.images ?? [];
          addRecent({
            id: res.product.id, name: res.product.name, slug: res.product.slug,
            price: res.product.price, mrp: res.product.mrp, image: imgs[0] ?? "",
          });
        }
      })
      .catch(() => { if (!cancelled) setData({ forSlug: slug, product: null, related: [], frequentlyBought: [] }); });
    return () => { cancelled = true; };
  }, [slug]);

  // JSON-LD for SEO
  useEffect(() => {
    if (!product) return;
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "Product",
      name: product.name, image: product.images, description: product.description, sku: product.sku,
      brand: { "@type": "Brand", name: product.brand ?? product.category.name },
      offers: { "@type": "Offer", priceCurrency: "INR", price: (product.price / 100).toFixed(2), availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
      ...(product.reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } } : {}),
    });
    document.head.appendChild(ld);
    return () => { ld.remove(); };
  }, [product]);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-3 py-6 sm:px-6 lg:grid-cols-2">
        <div className="aspect-square w-full rounded-2xl bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-5 w-1/3 rounded bg-muted animate-pulse" />
          <div className="h-10 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-24 w-full rounded bg-muted animate-pulse" />
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

  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const savings = product.mrp - product.price;

  // EMI calculations (no-cost EMI for 3/6 months, standard for 9/12)
  const emiOptions = [
    { months: 3, amount: Math.ceil(product.price / 3 / 100) * 100, type: "No Cost EMI" },
    { months: 6, amount: Math.ceil(product.price / 6 / 100) * 100, type: "No Cost EMI" },
    { months: 9, amount: Math.ceil(product.price * 1.12 / 9 / 100) * 100, type: "Standard EMI (12%)" },
    { months: 12, amount: Math.ceil(product.price * 1.14 / 12 / 100) * 100, type: "Standard EMI (14%)" },
  ];

  // Derived specs (fallback when product.specifications is empty)
  const derivedSpecs: Record<string, string> = {
    Brand: product.brand ?? product.category.name,
    SKU: product.sku,
    Category: product.category.name,
    ...(product.warranty ? { Warranty: product.warranty } : {}),
  };
  const specs = { ...derivedSpecs, ...product.specifications };
  const hasSpecs = Object.keys(specs).length > 0;

  function shareProduct() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({ title: product!.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copied to clipboard"));
    }
  }

  // FBT total
  const fbtTotal = product.price + fbt.reduce((s, p) => s + p.price, 0);

  async function addFbtToCart() {
    let ok = 0;
    const items = [{ id: product!.id, qty: 1 }, ...fbt.map((p) => ({ id: p.id, qty: 1 }))];
    for (const it of items) {
      const r = await addToCart(it.id, it.qty);
      if (r) ok++;
    }
    if (ok === items.length) {
      toast.success("All items added to cart");
      navigate("/cart");
    } else {
      toast.error("Some items are out of stock");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <button onClick={() => navigate("/")} className="hover:text-foreground">Home</button>
        <span className="mx-1.5">/</span>
        <button onClick={() => navigate(`/shop?category=${product.category.slug}`)} className="hover:text-foreground">{product.category.name}</button>
        <span className="mx-1.5">/</span>
        <span className="line-clamp-1 inline-block text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <ProductGallery images={product.images} alt={product.name} />

        {/* Purchase box */}
        <div className="space-y-4">
          {/* Brand + title */}
          <div>
            {product.brand && (
              <p className="text-xs font-bold uppercase tracking-wide text-primary">{product.brand}</p>
            )}
            <h1 className="mt-0.5 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{product.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              {product.reviewCount > 0 ? (
                <button className="flex items-center gap-1.5" onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })}>
                  <StarRating rating={product.rating} size={14} />
                  <span className="text-sm font-medium text-primary">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">({product.reviewCount} reviews)</span>
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">No reviews yet</span>
              )}
              <span className="text-xs text-muted-foreground">· {product.soldCount}+ sold</span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <Price price={product.price} mrp={product.mrp} size="lg" />
            {savings > 0 && (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">You save {formatINR(savings)} ({discount}%)</p>
            )}
            <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
          </div>

          <Separator />

          {/* Pincode delivery check */}
          <PincodeChecker codEnabled={codEnabled} />

          {/* Stock + quantity */}
          <div className="flex flex-wrap items-center gap-3">
            {product.stock > 0 ? (
              <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Package className="h-3 w-3" /> {product.stock} in stock
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">Out of stock</Badge>
            )}
            {product.stock > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Qty:</span>
                <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, Math.min(10, product.stock))} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button size="lg" className="flex-1 rounded-full text-base" disabled={product.stock === 0}
              onClick={async () => { const ok = await addToCart(product.id, quantity); if (ok) toast.success("Added to cart", { description: product.name }); }}>
              <ShoppingCart className="h-5 w-5" /> Add to Cart
            </Button>
            <Button size="lg" variant="secondary" className="flex-1 rounded-full text-base" disabled={product.stock === 0}
              onClick={async () => { const ok = await addToCart(product.id, quantity); if (ok) navigate("/checkout"); }}>
              <Zap className="h-5 w-5" /> Buy Now
            </Button>
            {wishlistEnabled && (
              <Button size="lg" variant="outline" className="rounded-full px-4" onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist">
                <Heart className={`h-5 w-5 ${wished ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            )}
            <Button size="lg" variant="outline" className="rounded-full px-4" onClick={shareProduct} aria-label="Share product">
              <Link2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Offers + EMI */}
          <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-bold">Offers</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2">
                <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span><span className="font-semibold">Bank Offer</span> 5% Cashback on credit/debit card orders above ₹999</span>
              </div>
              <div className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><span className="font-semibold">Special Price</span> {discount > 0 ? `${discount}% off — save ${formatINR(savings)}` : "Best price guaranteed"}</span>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span><span className="font-semibold">Free Shipping</span> on orders above ₹999</span>
              </div>
            </div>
            {/* EMI */}
            <button type="button" className="mt-2 flex w-full items-center justify-between text-xs font-semibold text-primary" onClick={() => setShowEmi(!showEmi)}>
              <span>No Cost EMI from {formatINR(emiOptions[0].amount)}/month</span>
              {showEmi ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showEmi && (
              <div className="mt-2 space-y-1.5 rounded-lg border bg-background p-3 text-xs">
                {emiOptions.map((e) => (
                  <div key={e.months} className="flex items-center justify-between">
                    <span><span className="font-semibold">{formatINR(e.amount)}/mo</span> for {e.months} months</span>
                    <Badge variant="outline" className="text-[10px]">{e.type}</Badge>
                  </div>
                ))}
                <p className="pt-1 text-muted-foreground">EMI available on credit cards. Final amount may vary by bank.</p>
              </div>
            )}
          </div>

          {/* Key highlights */}
          {product.highlights.length > 0 && (
            <div className="rounded-xl border p-4">
              <p className="mb-2 text-sm font-bold">Key highlights</p>
              <ul className="space-y-1.5">
                {product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Perks */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border p-3 text-center">
            <div className="flex flex-col items-center gap-1 py-1">
              <Truck className="h-4 w-4 text-primary" /><span className="text-[11px] font-medium leading-tight">Fast delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-1">
              <ShieldCheck className="h-4 w-4 text-primary" /><span className="text-[11px] font-medium leading-tight">Secure payment</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-1">
              <RefreshCcw className="h-4 w-4 text-primary" /><span className="text-[11px] font-medium leading-tight">7-day returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently bought together */}
      {fbt.length > 0 && (
        <section className="mt-10">
          <SectionHeader title="Frequently bought together" />
          <div className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Current product */}
              <FBTThumb name={product.name} image={product.images[0] ?? ""} price={product.price} />
              <span className="text-xl font-bold text-muted-foreground">+</span>
              {fbt.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <FBTThumb name={p.name} image={p.image} price={p.price} onClick={() => navigate(`/product/${p.slug}`)} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total price for all {fbt.length + 1} items</p>
                <p className="text-xl font-extrabold">{formatINR(fbtTotal)}</p>
              </div>
              <Button onClick={addFbtToCart} className="gap-2 rounded-full"><ShoppingCart className="h-4 w-4" /> Add all to cart</Button>
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      <section className="mt-10">
        <h2 className="mb-2 text-lg font-bold">Product description</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
        {product.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.tags.map((t) => <Badge key={t} variant="outline" className="text-[11px]">{t}</Badge>)}
          </div>
        )}
      </section>

      {/* Specifications */}
      {hasSpecs && (
        <section className="mt-10">
          <button type="button" className="flex w-full items-center justify-between" onClick={() => setShowSpecs(!showSpecs)}>
            <h2 className="text-lg font-bold">Specifications</h2>
            {showSpecs ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {showSpecs && (
            <div className="mt-3 overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(specs).map(([key, value], i) => (
                    <tr key={key} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="w-1/3 p-3 font-medium align-top">{key}</td>
                      <td className="p-3 text-muted-foreground">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Delivery & Returns info */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <Truck className="mb-2 h-5 w-5 text-primary" />
          <p className="text-sm font-semibold">Fast delivery</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Orders shipped within 24 hours. Delivery in 3-5 business days across 19,000+ pincodes.</p>
        </div>
        <div className="rounded-xl border p-4">
          <RefreshCcw className="mb-2 h-5 w-5 text-primary" />
          <p className="text-sm font-semibold">7-day returns</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Not satisfied? Return within 7 days for a full refund. Item must be unused with original packaging.</p>
        </div>
        <div className="rounded-xl border p-4">
          <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
          <p className="text-sm font-semibold">Warranty &amp; support</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{product.warranty ?? "Manufacturer warranty included. Contact support for assistance."}</p>
        </div>
      </section>

      {/* Reviews */}
      {reviewsEnabled && (
        <section id="reviews" className="mt-12">
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
        <section className="mt-12">
          <SectionHeader title="You may also like" viewAllHref={`/shop?category=${product.category.slug}`} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function FBTThumb({ name, image, price, onClick }: { name: string; image: string; price: number; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-32 flex-col items-center gap-1.5 text-center">
      <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
        {image && (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        )}
      </div>
      <span className="line-clamp-1 text-[11px] font-medium">{name}</span>
      <span className="text-xs font-bold">{formatINR(price)}</span>
    </button>
  );
}
