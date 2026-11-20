"use client";

import { useState } from "react";
import { AlertCircle, BadgeCheck, ExternalLink, Loader2, Plug, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, ToggleRow } from "./field";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import type { SiteSettings } from "@/types";

/** Payments tab — COD + Razorpay gateway config with a LIVE setup guide and test-connection. */
export function PaymentsTab({
  settings,
  set,
  hasKeys,
  razorpayKeyId,
  razorpaySecret,
  setRazorpayKeyId,
  setRazorpaySecret,
  webhookSecret,
  setWebhookSecret,
  hasWebhookSecret,
}: {
  settings: SiteSettings;
  set: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void;
  hasKeys: boolean;
  razorpayKeyId: string;
  razorpaySecret: string;
  setRazorpayKeyId: (v: string) => void;
  setRazorpaySecret: (v: string) => void;
  /** Optional until the parent wires it up — guarded below so the tab renders standalone. */
  webhookSecret?: string;
  setWebhookSecret?: (v: string) => void;
  hasWebhookSecret?: boolean;
}) {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; mode: string | null; message: string } | null>(null);

  const keyMode = razorpayKeyId
    ? (razorpayKeyId.startsWith("rzp_live_") ? "live" : razorpayKeyId.startsWith("rzp_test_") ? "test" : "unknown")
    : hasKeys ? "saved" : "none";

  async function testConnection() {
    setTesting(true);
    setStatus(null);
    try {
      // If the admin just typed new keys, they must Save first (test reads from DB)
      if (razorpayKeyId.trim() || razorpaySecret) {
        toast.info("Save your new keys first, then test the connection.");
        return;
      }
      const res = await api<{ ok: boolean; mode: string | null; message?: string; error?: string }>("/admin/payments/test-connection", {
        method: "POST",
      });
      setStatus({ ok: res.ok, mode: res.mode, message: res.ok ? res.message ?? "Connected" : res.error ?? "Failed" });
      toast[res.ok ? "success" : "error"](res.ok ? res.message ?? "Connected" : res.error ?? "Connection failed");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Connection failed";
      setStatus({ ok: false, mode: null, message: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
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

          {/* Key status indicator */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
            <span className="font-semibold">Gateway status:</span>
            {keyMode === "none" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <AlertCircle className="h-3 w-3" /> Not configured
              </span>
            )}
            {keyMode === "saved" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <BadgeCheck className="h-3 w-3" /> Keys saved (mode hidden until re-typed)
              </span>
            )}
            {keyMode === "test" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                <Zap className="h-3 w-3" /> Test mode
              </span>
            )}
            {keyMode === "live" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="h-3 w-3" /> Live mode
              </span>
            )}
            <span className="text-muted-foreground">
              {settings.razorpayEnabled ? "· enabled at checkout" : "· disabled at checkout"}
            </span>
          </div>

          {settings.razorpayEnabled && (
            <div className="grid gap-4 rounded-xl border border-dashed p-4 sm:grid-cols-2">
              <Field label={`Razorpay Key ID ${hasKeys ? "(saved — leave blank to keep)" : ""}`}>
                <Input
                  value={razorpayKeyId}
                  onChange={(e) => setRazorpayKeyId(e.target.value)}
                  placeholder={hasKeys ? "••••••••••••" : "rzp_live_xxxxxxxx (or rzp_test_…)"}
                  className="font-mono"
                />
              </Field>
              <Field label={`Razorpay Key Secret ${hasKeys ? "(saved — leave blank to keep)" : ""}`}>
                <Input
                  type="password"
                  value={razorpaySecret}
                  onChange={(e) => setRazorpaySecret(e.target.value)}
                  placeholder={hasKeys ? "••••••••••••" : "Enter your key secret"}
                  className="font-mono"
                />
              </Field>

              {/* Webhook secret (optional prop — render only when the parent wires it up) */}
              {setWebhookSecret && (
                <Field
                  label={`Razorpay Webhook Secret ${hasWebhookSecret ? "(saved — leave blank to keep)" : "(optional — enables auto-confirmation)"}`}
                  className="sm:col-span-2"
                >
                  <Input
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret?.(e.target.value)}
                    placeholder={hasWebhookSecret ? "••••••••••••" : "Enter webhook secret from Razorpay Dashboard → Settings → Webhooks"}
                    className="font-mono"
                  />
                </Field>
              )}

              {/* Webhook setup info */}
              <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground sm:col-span-2">
                <p>
                  <span className="font-semibold text-foreground">Webhook URL</span> to register in Razorpay
                  Dashboard: <span className="break-all font-mono">https://your-store-domain/api/payments/razorpay/webhook</span> —
                  events: <span className="font-mono">payment.captured</span>,{" "}
                  <span className="font-mono">payment.failed</span>, <span className="font-mono">refund.processed</span>.
                  This auto-confirms orders even if the customer closes the browser mid-payment.
                </p>
              </div>

              {/* Test connection */}
              <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={testConnection} disabled={testing || (hasKeys && false)}>
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
                  Test connection
                </Button>
                {status && (
                  <span className={`text-xs font-medium ${status.ok ? "text-emerald-600" : "text-destructive"}`}>
                    {status.message}
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">
                Get your live/test keys from the Razorpay Dashboard → Settings → API Keys. Payments are verified
                server-side with HMAC-SHA256 signature checks. In test mode use Razorpay test cards to try the full flow.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Go-LIVE guide */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold">How to make payments LIVE (Razorpay)</h3>
          </div>
          <ol className="space-y-2.5 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
              <div>
                <p className="font-medium">Create a Razorpay account</p>
                <p className="text-xs text-muted-foreground">
                  Sign up at{" "}
                  <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline">
                    razorpay.com <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  and complete your KYC (PAN, business proof, bank account). KYC usually activates in 1–2 business hours.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
              <div>
                <p className="font-medium">Generate API keys</p>
                <p className="text-xs text-muted-foreground">
                  Dashboard → <span className="font-medium">Settings → API Keys → Generate Key</span>. Download or copy the
                  <span className="font-mono"> Key ID</span> and <span className="font-mono">Key Secret</span> immediately —
                  the secret is shown only once.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
              <div>
                <p className="font-medium">Paste keys here &amp; toggle Razorpay ON</p>
                <p className="text-xs text-muted-foreground">
                  Fill the Key ID + Secret fields above, enable the Razorpay toggle, then click <span className="font-medium">Save all changes</span>.
                  Keys are stored securely in the database and used only server-side.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
              <div>
                <p className="font-medium">Test, then go live</p>
                <p className="text-xs text-muted-foreground">
                  Use <span className="font-mono">rzp_test_…</span> keys first with Razorpay&apos;s{" "}
                  <a href="https://razorpay.com/docs/payments/cards/test-cards/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline">
                    test cards <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  to verify the full flow. When KYC is approved, switch to <span className="font-mono">rzp_live_…</span> keys, save, and you&apos;re accepting real payments.
                </p>
              </div>
            </li>
          </ol>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="font-semibold">How it works under the hood</p>
            <p className="mt-0.5">
              When a customer pays, our server creates a real Razorpay order (via <span className="font-mono">api.razorpay.com/v1/orders</span>),
              the checkout modal opens, and on success the signature is verified server-side with HMAC-SHA256 — so the order
              is marked PAID &amp; CONFIRMED only after the gateway confirms it. No manual verification needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
