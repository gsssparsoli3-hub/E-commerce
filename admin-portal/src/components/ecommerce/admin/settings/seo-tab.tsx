"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./field";
import type { SiteSettings } from "@/types";

/** SEO tab — page title, meta description, keywords (applied to storefront on save). */
export function SeoTab({
  settings,
  set,
}: {
  settings: SiteSettings;
  set: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void;
}) {
  return (
    <Card>
      <CardContent className="grid gap-4">
        <Field label="SEO title (page <title>)">
          <Input
            value={settings.seoTitle ?? ""}
            onChange={(e) => set("seoTitle", e.target.value)}
            placeholder="Shoperic — Online Shopping for…"
          />
        </Field>
        <Field label="Meta description">
          <Textarea
            rows={3}
            value={settings.seoDescription ?? ""}
            onChange={(e) => set("seoDescription", e.target.value)}
            placeholder="Shown in search engine results…"
          />
        </Field>
        <Field label="Keywords (comma separated)">
          <Input
            value={settings.seoKeywords ?? ""}
            onChange={(e) => set("seoKeywords", e.target.value)}
            placeholder="online shopping, electronics, fashion"
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          Applied to the storefront instantly on save. Product pages also emit schema.org JSON-LD structured data automatically.
        </p>
      </CardContent>
    </Card>
  );
}
