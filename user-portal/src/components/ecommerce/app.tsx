"use client";

import { useEffect } from "react";
import { Header } from "./layout/header";
import { Footer } from "./layout/footer";
import { MobileNav } from "./layout/mobile-nav";
import { AuthModal } from "./layout/auth-modal";
import { AppRouter } from "./app-router";
import { SplashScreen } from "./shared/splash-screen";
import { MaintenanceView } from "./store/maintenance-view";
import { useSettingsStore } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";

/**
 * Storefront shell. The admin panel lives in its own deployable app
 * (../admin-portal) — this portal is 100% customer-facing.
 */
export function EcommerceApp() {
  const fetchSettings = useSettingsStore((s) => s.fetch);
  const settings = useSettingsStore((s) => s.settings);
  const settingsReady = useSettingsStore((s) => s.ready);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.ready);
  const refreshCart = useCartStore((s) => s.refresh);
  const refreshWishlist = useWishlistStore((s) => s.refresh);

  useEffect(() => {
    // Fire settings + me in parallel (independent) — then cart + wishlist (depend on auth)
    let cancelled = false;
    Promise.all([fetchSettings(), fetchMe()])
      .then(() => {
        if (cancelled) return;
        return Promise.all([refreshCart(), refreshWishlist()]);
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, []);

  const ready = settingsReady && authReady;
  if (!ready) return <SplashScreen />;

  const maintenance = settings?.maintenanceMode && user?.role !== "ADMIN";

  if (maintenance) {
    return (
      <div className="min-h-screen">
        <MaintenanceView />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <AppRouter />
      </main>
      <Footer />
      <MobileNav />
      <AuthModal />
    </div>
  );
}
