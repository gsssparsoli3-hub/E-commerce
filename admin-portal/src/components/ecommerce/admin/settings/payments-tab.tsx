"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, ToggleRow } from "./field";
import type { SiteSettings } from "@/types";

/** Payments tab — COD + Razorpay gateway config (keys entered here, verified server-side). */
export function PaymentsTab({
  settings,
  set,
  hasKeys,
  razorpayKeyId,
  razorpaySecret,
  setRazorpayKeyId,
  setRazorpaySecret,
}: {
  settings: SiteSettings;
  set: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void;
  hasKeys: boolean;
  razorpayKeyId: string;
  razorpaySecret: string;
  setRazorpayKeyId: (v: string) => void;
  setRazorpaySecret: (v: string) => void;
}) {
  return (
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
  );
}
