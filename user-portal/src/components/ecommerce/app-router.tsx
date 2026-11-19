"use client";

import { HomeView } from "./store/home-view";
import { ShopView } from "./store/shop-view";
import { ProductView } from "./store/product-view";
import { CartView } from "./store/cart-view";
import { CheckoutView } from "./store/checkout-view";
import { OrdersView } from "./store/orders-view";
import { WishlistView } from "./store/wishlist-view";
import { ProfileView } from "./store/profile-view";
import { EmptyState } from "./shared/empty-state";
import { Compass } from "lucide-react";
import { useRoute, useRouterStore } from "@/stores/router";

/** Client-side view switch for the storefront (hash router). */
export function AppRouter() {
  const { segments } = useRoute();
  const navigate = useRouterStore((s) => s.navigate);

  const [root, param] = segments;

  switch (root) {
    case undefined:
      return <HomeView />;
    case "shop":
      return <ShopView />;
    case "product":
      return param ? <ProductView slug={param} /> : <NotFound onHome={() => navigate("/")} />;
    case "cart":
      return <CartView />;
    case "checkout":
      return <CheckoutView />;
    case "orders":
      return <OrdersView />;
    case "wishlist":
      return <WishlistView />;
    case "profile":
      return <ProfileView />;
    default:
      return <NotFound onHome={() => navigate("/")} />;
  }
}

function NotFound({ onHome }: { onHome: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or was moved."
        actionLabel="Go home"
        onAction={onHome}
      />
    </div>
  );
}
