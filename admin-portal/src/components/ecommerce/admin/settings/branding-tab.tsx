"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUploader } from "../../shared/image-uploader";
import { Field } from "./field";
import type { SiteSettings } from "@/types";

/** Branding tab — logo, favicon, primary color, social links. */
export function BrandingTab({
  settings,
  set,
}: {
  settings: SiteSettings;
  set: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void;
}) {
  return (
    <Card>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Store logo</Label>
          <ImageUploader
            images={settings.logoUrl ? [settings.logoUrl] : []}
            onChange={(imgs) => set("logoUrl", imgs[0] ?? null)}
            max={1}
            single
          />
        </div>
        <div className="space-y-1.5">
          <Label>Favicon</Label>
          <ImageUploader
            images={settings.faviconUrl ? [settings.faviconUrl] : []}
            onChange={(imgs) => set("faviconUrl", imgs[0] ?? null)}
            max={1}
            single
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Primary brand color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border bg-background p-1"
              aria-label="Pick primary color"
            />
            <Input
              value={settings.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="w-32 font-mono"
            />
            <div
              className="flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-semibold text-white"
              style={{ background: settings.primaryColor }}
            >
              Live preview — buttons, links & highlights
            </div>
          </div>
        </div>
        <div className="space-y-3 sm:col-span-2">
          <Label>Social links</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {["instagram", "twitter", "facebook", "youtube"].map((key) => (
              <Field key={key} label={key[0].toUpperCase() + key.slice(1)}>
                <Input
                  value={settings.social?.[key] ?? ""}
                  onChange={(e) => set("social", { ...settings.social, [key]: e.target.value })}
                  placeholder={`https://${key}.com/yourstore`}
                />
              </Field>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
