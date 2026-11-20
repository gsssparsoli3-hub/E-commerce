"use client";

import { Banknote, CreditCard } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SiteSettings } from "@/types";

/** Payment method selector — COD + Razorpay (whichever the admin has enabled). */
export function PaymentSection({
  paymentMethod,
  setPaymentMethod,
  settings,
}: {
  paymentMethod: "COD" | "RAZORPAY";
  setPaymentMethod: (m: "COD" | "RAZORPAY") => void;
  settings: SiteSettings | null;
}) {
  return (
    <section aria-labelledby="payment-heading">
      <h2 id="payment-heading" className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
        Payment Method
      </h2>
      <RadioGroup
        value={paymentMethod}
        onValueChange={(v) => setPaymentMethod(v as "COD" | "RAZORPAY")}
        className="grid gap-3"
      >
        {settings?.codEnabled && (
          <Label
            htmlFor="pay-cod"
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
              paymentMethod === "COD" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <RadioGroupItem value="COD" id="pay-cod" />
            <Banknote className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">Pay in cash when your order arrives</p>
            </div>
          </Label>
        )}
        {settings?.razorpayEnabled && (
          <Label
            htmlFor="pay-online"
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
              paymentMethod === "RAZORPAY" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <RadioGroupItem value="RAZORPAY" id="pay-online" />
            <CreditCard className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">Pay Online (Razorpay)</p>
              <p className="text-xs text-muted-foreground">
                UPI, cards, net banking & wallets — secured by Razorpay
              </p>
            </div>
          </Label>
        )}
        {!settings?.codEnabled && !settings?.razorpayEnabled && (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No payment methods are enabled. Please contact support.
          </p>
        )}
      </RadioGroup>
    </section>
  );
}
