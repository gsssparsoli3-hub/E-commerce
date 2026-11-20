"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ToggleRow } from "./field";
import type { SiteSettings } from "@/types";

/** Features tab — wishlist, reviews, coupons toggles. */
export function FeaturesTab({
  settings,
  set,
}: {
  settings: SiteSettings;
  set: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <ToggleRow
          label="Wishlist"
          description="Let customers save products to a wishlist"
          checked={settings.wishlistEnabled}
          onChange={(v) => set("wishlistEnabled", v)}
        />
        <ToggleRow
          label="Product reviews"
          description="Customers can rate & review products"
          checked={settings.reviewsEnabled}
          onChange={(v) => set("reviewsEnabled", v)}
        />
        <ToggleRow
          label="Coupons"
          description="Enable discount codes at checkout"
          checked={settings.couponsEnabled}
          onChange={(v) => set("couponsEnabled", v)}
        />
      </CardContent>
    </Card>
  );
}
