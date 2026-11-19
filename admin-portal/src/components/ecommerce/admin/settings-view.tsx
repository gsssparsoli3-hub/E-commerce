"use client";

import { useEffect, useState } from "react";
import { CreditCard, Globe, Loader2, Megaphone, Palette, Save, Ship, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "../shared/image-uploader";
import { api } from "@/lib/client-api";
import { useSettingsStore } from "@/stores/settings";
import type { SiteSettings } from "@/types";

export function AdminSettingsView() {
  const refetchSettings = useSettingsStore((s) => s.fetch);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [hasKeys, setHasKeys] = useState(false);
  const [busy, setBusy] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpaySecret, setRazorpaySecret] = useState("");

  useEffect(() => {
    api<{ settings: SiteSettings; hasRazorpayKeys: boolean }>("/admin/settings").then((r) => {
      setSettings(r.settings);
      setHasKeys(r.hasRazorpayKeys);
    }).catch(() => null);
  }, []);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!settings) return;
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        siteName: settings.siteName,
        tagline: settings.tagline,
        announcement: settings.announcement,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        primaryColor: settings.primaryColor,
        seoTitle: settings.seoTitle,
        seoDescription: settings.seoDescription,
        seoKeywords: settings.seoKeywords,
        codEnabled: settings.codEnabled,
        razorpayEnabled: settings.razorpayEnabled,
        shippingFee: settings.shippingFee,
        freeShippingAbove: settings.freeShippingAbove,
        wishlistEnabled: settings.wishlistEnabled,
        reviewsEnabled: settings.reviewsEnabled,
        couponsEnabled: settings.couponsEnabled,
        maintenanceMode: settings.maintenanceMode,
        adminUrl: settings.adminUrl,
        storeUrl: settings.storeUrl,
        social: settings.social,
      };
      if (razorpayKeyId.trim()) payload.razorpayKeyId = razorpayKeyId.trim();
      if (razorpaySecret) payload.razorpayKeySecret = razorpaySecret;

      const res = await api<{ settings: SiteSettings; hasRazorpayKeys: boolean }>("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSettings(res.settings);
      setHasKeys(res.hasRazorpayKeys);
      setRazorpayKeyId("");
      setRazorpaySecret("");
      await refetchSettings(); // live-apply color/name across the app
      toast.success("Settings saved — applied across the store");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Store Settings</h1>
        <Button className="ml-auto gap-1.5" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save all changes
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex w-full flex-wrap justify-start overflow-x-auto">
          <TabsTrigger value="general" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> General</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Branding</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Payments</TabsTrigger>
          <TabsTrigger value="shipping" className="gap-1.5"><Ship className="h-3.5 w-3.5" /> Shipping</TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Features</TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" /> SEO</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general">
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Store name"><Input value={settings.siteName} onChange={(e) => set("siteName", e.target.value)} /></Field>
              <Field label="Tagline"><Input value={settings.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
              <Field label="Support email"><Input type="email" value={settings.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} /></Field>
              <Field label="Support phone"><Input value={settings.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} /></Field>
              <Field label="Announcement bar (empty = hidden)" className="sm:col-span-2">
                <Input value={settings.announcement ?? ""} onChange={(e) => set("announcement", e.target.value)} placeholder="Free shipping on orders above ₹999" />
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
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding">
          <Card>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Store logo</Label>
                <ImageUploader images={settings.logoUrl ? [settings.logoUrl] : []} onChange={(imgs) => set("logoUrl", imgs[0] ?? null)} max={1} single />
              </div>
              <div className="space-y-1.5">
                <Label>Favicon</Label>
                <ImageUploader images={settings.faviconUrl ? [settings.faviconUrl] : []} onChange={(imgs) => set("faviconUrl", imgs[0] ?? null)} max={1} single />
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
                  <div className="flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-semibold text-white" style={{ background: settings.primaryColor }}>
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
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="space-y-4">
              <ToggleRow
                label="Cash on Delivery"
                description="Let customers pay in cash when the order arrives"
                checked={settings.codEnabled}
                onChange={(v) => set("codEnabled", v)}
              />
              <ToggleRow
                label="Razorpay (Cards / UPI / Net Banking)"
                description="Real payment gateway — accepts all major Indian payment methods"
                checked={settings.razorpayEnabled}
                onChange={(v) => set("razorpayEnabled", v)}
              />
              {settings.razorpayEnabled && (
                <div className="grid gap-4 rounded-xl border border-dashed p-4 sm:grid-cols-2">
                  <Field label={`Razorpay Key ID ${hasKeys ? "(saved — leave blank to keep)" : ""}`}>
                    <Input
                      value={razorpayKeyId}
                      onChange={(e) => setRazorpayKeyId(e.target.value)}
                      placeholder={hasKeys ? "••••••••••••" : "rzp_test_xxxxxxxx"}
                    />
                  </Field>
                  <Field label={`Razorpay Key Secret ${hasKeys ? "(saved — leave blank to keep)" : ""}`}>
                    <Input
                      type="password"
                      value={razorpaySecret}
                      onChange={(e) => setRazorpaySecret(e.target.value)}
                      placeholder={hasKeys ? "••••••••••••" : "Enter your key secret"}
                    />
                  </Field>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">
                    Get your live/test keys from the Razorpay Dashboard → Settings → API Keys. Payments are verified
                    server-side with HMAC signature checks. In test mode use Razorpay test cards to try the full flow.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHIPPING */}
        <TabsContent value="shipping">
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Shipping fee (₹)">
                <Input
                  type="number" min="0"
                  value={settings.shippingFee / 100}
                  onChange={(e) => set("shippingFee", Math.round(Number(e.target.value) * 100))}
                />
              </Field>
              <Field label="Free shipping above (₹, 0 = never)">
                <Input
                  type="number" min="0"
                  value={settings.freeShippingAbove / 100}
                  onChange={(e) => set("freeShippingAbove", Math.round(Number(e.target.value) * 100))}
                />
              </Field>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Customers see a free-shipping progress hint in their cart based on these values.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEATURES */}
        <TabsContent value="features">
          <Card>
            <CardContent className="space-y-4">
              <ToggleRow label="Wishlist" description="Let customers save products to a wishlist" checked={settings.wishlistEnabled} onChange={(v) => set("wishlistEnabled", v)} />
              <ToggleRow label="Product reviews" description="Customers can rate & review products" checked={settings.reviewsEnabled} onChange={(v) => set("reviewsEnabled", v)} />
              <ToggleRow label="Coupons" description="Enable discount codes at checkout" checked={settings.couponsEnabled} onChange={(v) => set("couponsEnabled", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card>
            <CardContent className="grid gap-4">
              <Field label="SEO title (page <title>)">
                <Input value={settings.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} placeholder="Shoperic — Online Shopping for…" />
              </Field>
              <Field label="Meta description">
                <Textarea rows={3} value={settings.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} placeholder="Shown in search engine results…" />
              </Field>
              <Field label="Keywords (comma separated)">
                <Input value={settings.seoKeywords ?? ""} onChange={(e) => set("seoKeywords", e.target.value)} placeholder="online shopping, electronics, fashion" />
              </Field>
              <p className="text-xs text-muted-foreground">
                Applied to the storefront instantly on save. Product pages also emit schema.org JSON-LD structured data automatically.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label, description, checked, onChange, destructive,
}: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void; destructive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
      <div>
        <p className={`text-sm font-semibold ${destructive && checked ? "text-destructive" : ""}`}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
