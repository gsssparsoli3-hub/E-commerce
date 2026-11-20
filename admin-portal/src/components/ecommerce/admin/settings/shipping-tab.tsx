"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "./field";
import type { SiteSettings } from "@/types";

/** Shipping tab — flat fee + free-shipping threshold (entered in rupees, stored in paise). */
export function ShippingTab({
  settings,
  set,
}: {
  settings: SiteSettings;
  set: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void;
}) {
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Shipping fee (₹)">
          <Input
            type="number"
            min="0"
            value={settings.shippingFee / 100}
            onChange={(e) => set("shippingFee", Math.round(Number(e.target.value) * 100))}
          />
        </Field>
        <Field label="Free shipping above (₹, 0 = never)">
          <Input
            type="number"
            min="0"
            value={settings.freeShippingAbove / 100}
            onChange={(e) => set("freeShippingAbove", Math.round(Number(e.target.value) * 100))}
          />
        </Field>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Customers see a free-shipping progress hint in their cart based on these values.
        </p>
      </CardContent>
    </Card>
  );
}
