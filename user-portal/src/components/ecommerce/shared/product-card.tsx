"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "./price";
import { StarRating } from "./star-rating";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useSettingsStore } from "@/stores/settings";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const add = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.ids.includes(product.id));
  const wishlistEnabled = useSettingsStore((s) => s.settings?.wishlistEnabled ?? true);
  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <Card className="group relative overflow-hidden border-border/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <Link
        href={`#/product/${product.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-xl"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.images[0] ?? "/brand/logo.png"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {discount > 0 && (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[10px] font-bold">
                {discount}% OFF
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="secondary" className="text-[10px] font-semibold">
                Out of stock
              </Badge>
            )}
          </div>
        </div>
      </Link>

      {wishlistEnabled && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur"
          onClick={() => toggleWishlist(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 transition-colors ${wished ? "fill-red-500 text-red-500" : ""}`} />
        </Button>
      )}

      <CardContent className="space-y-1.5 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {product.category.name}
        </p>
        <Link href={`#/product/${product.slug}`} className="block">
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <StarRating rating={product.rating} count={product.reviewCount} size={12} />
        <div className="flex items-center justify-between pt-1">
          <Price price={product.price} mrp={product.mrp} size="sm" />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            disabled={product.stock === 0}
            onClick={async () => {
              const ok = await add(product.id);
              if (ok) toast.success("Added to cart", { description: product.name });
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
