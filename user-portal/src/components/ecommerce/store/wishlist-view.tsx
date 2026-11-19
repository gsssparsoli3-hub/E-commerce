"use client";

import { Heart } from "lucide-react";
import { ProductCard } from "../shared/product-card";
import { EmptyState } from "../shared/empty-state";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { useWishlistStore } from "@/stores/wishlist";
import { useRouterStore } from "@/stores/router";

export function WishlistView() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const openAuth = useUiStore((s) => s.openAuth);
  const products = useWishlistStore((s) => s.products);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={Heart}
          title="Sign in to see your wishlist"
          description="Save products you love and find them anytime."
          actionLabel="Sign in"
          onAction={() => openAuth("login")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">
        My Wishlist <span className="text-base font-medium text-muted-foreground">({products.length} items)</span>
      </h1>
      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here."
          actionLabel="Discover products"
          onAction={() => navigate("/shop")}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
