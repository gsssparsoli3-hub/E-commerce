"use client";

import { useEffect, useState } from "react";
import { CreditCard, Globe, Loader2, Mail, Megaphone, Palette, Save, Ship, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/client-api";
import { useSettingsStore } from "@/stores/settings";
import type { SiteSettings } from "@/types";
import { GeneralTab } from "./settings/general-tab";
import { BrandingTab } from "./settings/branding-tab";
import { PaymentsTab } from "./settings/payments-tab";
import { EmailTab, type SMTPForm } from "./settings/email-tab";
import { ShippingTab } from "./settings/shipping-tab";
import { FeaturesTab } from "./settings/features-tab";
import { SeoTab } from "./settings/seo-tab";

type SettingsResponse = {
  settings: SiteSettings;
  hasRazorpayKeys: boolean;
  hasSMTP: boolean;
  hasWebhookSecret: boolean;
};

/**
 * Admin settings — orchestrates 7 tabs (General, Branding, Payments, Email,
 * Shipping, Features, SEO). Each tab is a small presentational component in
 * ./settings/*.tsx; this file owns state + the save action.
 */
export function AdminSettingsView() {
  const refetchSettings = useSettingsStore((s) => s.fetch);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [hasKeys, setHasKeys] = useState(false);
  const [busy, setBusy] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpaySecret, setRazorpaySecret] = useState("");
  const [smtp, setSmtp] = useState<SMTPForm>({ host: "", port: "587", user: "", pass: "", from: "" });
  const [hasSMTP, setHasSMTP] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [hasWebhookSecret, setHasWebhookSecret] = useState(false);

  useEffect(() => {
    api<SettingsResponse>("/admin/settings")
      .then((r) => {
        setSettings(r.settings);
        setHasKeys(r.hasRazorpayKeys);
        setHasSMTP(r.hasSMTP);
        setHasWebhookSecret(r.hasWebhookSecret);
      })
      .catch(() => null);
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

      // SMTP (email) — blank fields keep the saved values, same contract as the Razorpay secret.
      // The port travels with the host (re-configuring SMTP implies the port shown in the form).
      if (smtp.host.trim()) {
        payload.smtpHost = smtp.host.trim();
        const port = Math.round(Number(smtp.port));
        if (smtp.port.trim() && port > 0) payload.smtpPort = port;
      }
      if (smtp.user.trim()) payload.smtpUser = smtp.user.trim();
      if (smtp.pass) payload.smtpPass = smtp.pass;
      if (smtp.from.trim()) payload.smtpFrom = smtp.from.trim();
      if (webhookSecret.trim()) payload.razorpayWebhookSecret = webhookSecret.trim();

      const res = await api<SettingsResponse>("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSettings(res.settings);
      setHasKeys(res.hasRazorpayKeys);
      setHasSMTP(res.hasSMTP);
      setHasWebhookSecret(res.hasWebhookSecret);
      setRazorpayKeyId("");
      setRazorpaySecret("");
      setWebhookSecret("");
      setSmtp((s) => ({ ...s, pass: "" }));
      await refetchSettings(); // live-apply color/name across the app
      toast.success("Settings saved — applied across the store");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
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
          <TabsTrigger value="email" className="gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</TabsTrigger>
          <TabsTrigger value="shipping" className="gap-1.5"><Ship className="h-3.5 w-3.5" /> Shipping</TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Features</TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" /> SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralTab settings={settings} set={set} /></TabsContent>
        <TabsContent value="branding"><BrandingTab settings={settings} set={set} /></TabsContent>
        <TabsContent value="payments">
          <PaymentsTab
            settings={settings}
            set={set}
            hasKeys={hasKeys}
            razorpayKeyId={razorpayKeyId}
            razorpaySecret={razorpaySecret}
            setRazorpayKeyId={setRazorpayKeyId}
            setRazorpaySecret={setRazorpaySecret}
            webhookSecret={webhookSecret}
            setWebhookSecret={setWebhookSecret}
            hasWebhookSecret={hasWebhookSecret}
          />
        </TabsContent>
        <TabsContent value="email">
          <EmailTab smtp={smtp} setSmtp={setSmtp} hasSMTP={hasSMTP} />
        </TabsContent>
        <TabsContent value="shipping"><ShippingTab settings={settings} set={set} /></TabsContent>
        <TabsContent value="features"><FeaturesTab settings={settings} set={set} /></TabsContent>
        <TabsContent value="seo"><SeoTab settings={settings} set={set} /></TabsContent>
      </Tabs>
    </div>
  );
}
