"use client";

import { useState } from "react";
import {
  BarChart3, Image, LayoutDashboard, LogOut, Menu, Package, Settings,
  ShoppingCart, Store, Tag, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DashboardView } from "./dashboard-view";
import { AdminProductsView } from "./products-view";
import { AdminCategoriesView } from "./categories-view";
import { AdminOrdersView } from "./orders-view";
import { AdminUsersView } from "./users-view";
import { AdminCouponsView } from "./coupons-view";
import { AdminBannersView } from "./banners-view";
import { AdminSettingsView } from "./settings-view";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useRouterStore } from "@/stores/router";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Orders", to: "/admin/orders", icon: ShoppingCart },
  { label: "Products", to: "/admin/products", icon: Package },
  { label: "Categories", to: "/admin/categories", icon: Tag },
  { label: "Banners", to: "/admin/banners", icon: Image },
  { label: "Coupons", to: "/admin/coupons", icon: BarChart3 },
  { label: "Customers", to: "/admin/users", icon: Users },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export function AdminApp() {
  const path = useRouterStore((s) => s.path);
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const settings = useSettingsStore((s) => s.settings);
  const [navOpen, setNavOpen] = useState(false);

  const active = (to: string) => (to === "/admin" ? path === "/admin" : path.startsWith(to));

  const Nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin navigation">
      {NAV.map((item) => (
        <button
          key={item.to}
          onClick={() => { navigate(item.to); setNavOpen(false); }}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            active(item.to)
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          aria-current={active(item.to) ? "page" : undefined}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-background lg:flex">
        <button onClick={() => navigate("/admin")} className="flex items-center gap-2.5 border-b p-4 text-left">
          <img src={settings?.logoUrl ?? "/brand/logo.png"} alt="" className="h-9 w-9 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-extrabold leading-tight">{settings?.siteName ?? "Admin"}</p>
            <p className="text-[11px] text-muted-foreground">Control Center</p>
          </div>
        </button>
        {Nav}
        <div className="space-y-1 border-t p-3">
          <button
            onClick={() => {
              const url = settings?.storeUrl || "/";
              if (url.startsWith("/")) window.location.href = url;
              else window.open(url, "_blank");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Store className="h-4 w-4" /> View Store
          </button>
          <button
            onClick={async () => { await logout(); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" aria-label="Open admin menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Admin menu</SheetTitle>
              <div className="flex h-full flex-col">
                <p className="border-b p-4 text-sm font-extrabold">{settings?.siteName} Admin</p>
                {Nav}
              </div>
            </SheetContent>
          </Sheet>
          <p className="text-sm font-semibold">
            {NAV.find((n) => active(n.to))?.label ?? "Admin"}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">{user?.email}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {user?.name.charAt(0)}
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <AdminRouter />
        </main>
      </div>
    </div>
  );
}

function AdminRouter() {
  const path = useRouterStore((s) => s.path);
  const section = path.replace(/^\/admin\/?/, "").split("?")[0];

  switch (section) {
    case "":
      return <DashboardView />;
    case "orders":
      return <AdminOrdersView />;
    case "products":
      return <AdminProductsView />;
    case "categories":
      return <AdminCategoriesView />;
    case "banners":
      return <AdminBannersView />;
    case "coupons":
      return <AdminCouponsView />;
    case "users":
      return <AdminUsersView />;
    case "settings":
      return <AdminSettingsView />;
    default:
      return <DashboardView />;
  }
}
