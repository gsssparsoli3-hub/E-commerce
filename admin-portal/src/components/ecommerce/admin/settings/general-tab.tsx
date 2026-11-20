"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, ToggleRow } from "./field";
import type { SiteSettings } from "@/types";

/** General tab — store identity, support contact, announcement bar, cross-portal URLs. */
export function GeneralTab({
  settings,
  set,
}: {
  settings: SiteSettings;
  set: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void;
}) {
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Store name">
          <Input value={settings.siteName} onChange={(e) => set("siteName", e.target.value)} />
        </Field>
        <Field label="Tagline">
          <Input value={settings.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </Field>
        <Field label="Support email">
          <Input type="email" value={settings.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
        </Field>
        <Field label="Support phone">
          <Input value={settings.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} />
        </Field>
        <Field label="Announcement bar (empty = hidden)" className="sm:col-span-2">
          <Input
            value={settings.announcement ?? ""}
            onChange={(e) => set("announcement", e.target.value)}
            placeholder="Free shipping on orders above ₹999"
          />
        </Field>
        <Field label="Admin panel URL (link shown to admins in the store)" className="sm:col-span-2">
          <Input
            value={settings.adminUrl ?? ""}
            onChange={(e) => set("adminUrl", e.target.value)}
            placeholder="https://admin.yourstore.com"
          />
        </Field>
        <Field label="Store URL (used by the admin console View Store button)" className="sm:col-span-2">
          <Input
            value={settings.storeUrl ?? ""}
            onChange={(e) => set("storeUrl", e.target.value)}
            placeholder="https://www.yourstore.com"
          />
        </Field>
        <ToggleRow
          label="Maintenance mode"
          description="Show a maintenance page to all customers (admins still have access)"
          checked={settings.maintenanceMode}
          onChange={(v) => set("maintenanceMode", v)}
          destructive
        />
      </CardContent>
    </Card>
  );
}
