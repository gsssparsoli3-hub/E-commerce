"use client";

import { Heart, Home, ShoppingCart, Store, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useUiStore } from "@/stores/ui";
import { useRouterStore } from "@/stores/router";
import { cn } from "@/lib/utils";

/** Bottom tab bar for mobile — app-like navigation. */
export function MobileNav() {
  const navigate = useRouterStore((s) => s.navigate);
  const path = useRouterStore((s) => s.path);
  const user = useAuthStore((s) => s.user);
  const openAuth = useUiStore((s) => s.openAuth);
  const cartCount = useCartStore((s) => s.count());
  const wishlistIds = useWishlistStore((s) => s.ids);

  const active = (prefix: string) => path === prefix || (prefix !== "/" && path.startsWith(prefix));

  const items = [
    { label: "Home", icon: Home, to: "/" },
    { label: "Shop", icon: Store, to: "/shop" },
    { label: "Cart", icon: ShoppingCart, to: "/cart", badge: cartCount },
    { label: "Wishlist", icon: Heart, to: "/wishlist", badge: user ? wishlistIds.length : 0 },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              active(item.to) ? "text-primary" : "text-muted-foreground"
            )}
            aria-label={item.label}
            aria-current={active(item.to) ? "page" : undefined}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {item.badge ? (
              <Badge className="absolute right-3 top-1 h-4 min-w-4 rounded-full px-1 text-[9px]">
                {item.badge}
              </Badge>
            ) : null}
          </button>
        ))}
        <button
          onClick={() => (user ? navigate("/profile") : openAuth("login"))}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
            active("/profile") ? "text-primary" : "text-muted-foreground"
          )}
          aria-label="Account"
        >
          <User className="h-5 w-5" />
          Account
        </button>
      </div>
    </nav>
  );
}
