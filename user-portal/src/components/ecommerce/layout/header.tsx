"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown, Heart, LayoutDashboard, LogOut, MapPin, Menu, Package,
  Search, ShoppingCart, User, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "../shared/theme-toggle";
import { SearchBar } from "../shared/search-bar";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useSettingsStore } from "@/stores/settings";
import { useWishlistStore } from "@/stores/wishlist";
import { useUiStore } from "@/stores/ui";
import { useRoute, useRouterStore } from "@/stores/router";
import type { Category } from "@/types";
import { api } from "@/lib/client-api";

export function Header() {
  const settings = useSettingsStore((s) => s.settings);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.count());
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const openAuth = useUiStore((s) => s.openAuth);
  const navigate = useRouterStore((s) => s.navigate);
  const { query } = useRoute();
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api<{ categories: Category[] }>("/categories").then((r) => setCategories(r.categories)).catch(() => null);
  }, []);

  const wishlistEnabled = settings?.wishlistEnabled ?? true;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Announcement bar */}
      {settings?.announcement && announcementOpen && (
        <div className="flex items-center justify-center gap-3 bg-primary px-10 py-1.5 text-center text-[13px] font-medium text-primary-foreground">
          <p>{settings.announcement}</p>
          <button
            onClick={() => setAnnouncementOpen(false)}
            className="absolute right-3 rounded-full p-0.5 hover:bg-primary-foreground/20"
            aria-label="Dismiss announcement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Main bar */}
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <MobileMenu categories={categories} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="#/" className="flex items-center gap-2" aria-label={`${settings?.siteName ?? "Store"} home`}>
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
                {(settings?.siteName ?? "S").charAt(0)}
              </span>
            )}
            <span className="hidden text-lg font-extrabold tracking-tight sm:block">
              {settings?.siteName ?? "Store"}
            </span>
          </Link>

          {/* Search (desktop) */}
          <div className="mx-auto hidden w-full max-w-xl lg:block">
            <SearchBar initialQuery={query.get("search") ?? ""} />
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <ThemeToggle />

            {wishlistEnabled && (
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => (user ? navigate("/wishlist") : openAuth("login"))}
                aria-label={`Wishlist (${wishlistCount} items)`}
              >
                <Heart className="h-4.5 w-4.5" />
                {user && wishlistCount > 0 && (
                  <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full px-1 text-[9px]">
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Account menu">
                    <User className="h-4.5 w-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <Package className="h-4 w-4" /> My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/wishlist")}>
                    <Heart className="h-4 w-4" /> Wishlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <MapPin className="h-4 w-4" /> Profile & Addresses
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && settings?.adminUrl && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          window.location.href = settings.adminUrl as string;
                        }}
                        className="font-semibold text-primary"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout();
                      navigate("/");
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="h-9 rounded-full px-4" onClick={() => openAuth("login")}>
                Sign in
              </Button>
            )}

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => navigate("/cart")}
              aria-label={`Cart (${cartCount} items)`}
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {cartCount > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full px-1 text-[9px]">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Search (mobile) */}
        <div className="border-t px-3 py-2 lg:hidden">
          <SearchBar initialQuery={query.get("search") ?? ""} />
        </div>

        {/* Category nav (desktop) */}
        <nav className="hidden border-t lg:block" aria-label="Categories">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-6">
            <button
              onClick={() => navigate("/shop")}
              className="flex items-center gap-1 py-2.5 text-sm font-semibold hover:text-primary"
            >
              All Products <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {categories.slice(0, 6).map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/shop?category=${c.slug}`)}
                className="py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => navigate("/shop?sort=discount")}
              className="ml-auto flex items-center gap-1 py-2.5 text-sm font-semibold text-primary"
            >
              <Search className="h-3.5 w-3.5" /> Deals
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function MobileMenu({ categories, onNavigate }: { categories: Category[]; onNavigate: () => void }) {
  const navigate = useRouterStore((s) => s.navigate);

  const go = (to: string) => {
    navigate(to);
    onNavigate();
  };

  const links = [
    { label: "Home", to: "/" },
    { label: "Shop All", to: "/shop" },
    { label: "My Orders", to: "/orders" },
    { label: "Wishlist", to: "/wishlist" },
    { label: "Profile", to: "/profile" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <p className="text-base font-extrabold">Menu</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Mobile navigation">
        {links.map((l) => (
          <button
            key={l.to}
            onClick={() => go(l.to)}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted"
          >
            {l.label}
          </button>
        ))}
        <p className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Categories
        </p>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => go(`/shop?category=${c.slug}`)}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {c.name}
          </button>
        ))}
      </nav>
    </div>
  );
}
