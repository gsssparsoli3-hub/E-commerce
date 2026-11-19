"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import { useRouterStore } from "@/stores/router";
import type { Category } from "@/types";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
};

export function Footer() {
  const settings = useSettingsStore((s) => s.settings);
  const navigate = useRouterStore((s) => s.navigate);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api<{ categories: Category[] }>("/categories").then((r) => setCategories(r.categories)).catch(() => null);
  }, []);

  const socialEntries = Object.entries(settings?.social ?? {}).filter(([, url]) => url);

  return (
    <footer className="mt-auto border-t bg-muted/40" role="contentinfo">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
                {(settings?.siteName ?? "S").charAt(0)}
              </span>
            )}
            <span className="text-lg font-extrabold tracking-tight">{settings?.siteName}</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {settings?.tagline ?? "Everything you love, delivered."}
          </p>
          {socialEntries.length > 0 && (
            <div className="flex gap-2 pt-1">
              {socialEntries.map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border bg-background transition-colors hover:border-primary hover:text-primary"
                >
                  {SOCIAL_ICONS[name] ?? null}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Shop */}
        <nav aria-label="Shop">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Shop</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <button onClick={() => navigate(`/shop?category=${c.slug}`)} className="hover:text-foreground">
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Links */}
        <nav aria-label="Quick links">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Quick Links</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><button onClick={() => navigate("/shop")} className="hover:text-foreground">All Products</button></li>
            <li><button onClick={() => navigate("/shop?sort=discount")} className="hover:text-foreground">Today&apos;s Deals</button></li>
            <li><button onClick={() => navigate("/orders")} className="hover:text-foreground">Track Order</button></li>
            <li><button onClick={() => navigate("/profile")} className="hover:text-foreground">My Account</button></li>
            <li><Link href="#/shop?sort=popular" className="hover:text-foreground">Best Sellers</Link></li>
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Support</h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {settings?.supportEmail && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:text-foreground">{settings.supportEmail}</a>
              </li>
            )}
            {settings?.supportPhone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${settings.supportPhone}`} className="hover:text-foreground">{settings.supportPhone}</a>
              </li>
            )}
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Serving 19,000+ pin codes across India</span>
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="rounded border bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">COD</span>
            <span className="rounded border bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">UPI</span>
            <span className="rounded border bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">Cards</span>
            <span className="rounded border bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">Net Banking</span>
          </div>
        </div>
      </div>

      <div className="border-t py-4">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {settings?.siteName ?? "Store"}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
