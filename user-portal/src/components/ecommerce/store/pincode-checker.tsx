"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PINCODE_KEY = "delivery-pincode";

function estimateDelivery(days: number): { date: string; day: string } {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return {
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    day: d.toLocaleDateString("en-IN", { weekday: "long" }),
  };
}

/**
 * Amazon-style "Deliver to [pincode] by [date]" widget.
 * Validates 6-digit Indian pincode, shows an estimated delivery date,
 * and persists the pincode in localStorage. No backend needed (estimate only).
 */
export function PincodeChecker({ codEnabled }: { codEnabled: boolean }) {
  const [pincode, setPincode] = useState("");
  const [entered, setEntered] = useState(false);
  const [eta, setEta] = useState<{ date: string; day: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PINCODE_KEY);
    if (saved && /^\d{6}$/.test(saved)) {
      setPincode(saved);
      setEntered(true);
      setEta(estimateDelivery(4));
    }
  }, []);

  function check(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) return;
    localStorage.setItem(PINCODE_KEY, pincode);
    setEntered(true);
    setEta(estimateDelivery(4));
  }

  function change() {
    setEntered(false);
    setEta(null);
  }

  if (entered && eta) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="flex-1 text-sm">
          <p>
            <span className="font-semibold">Delivery by {eta.day}, {eta.date}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Delivering to <span className="font-semibold">{pincode}</span>
            {codEnabled && " · Cash on Delivery available"}
          </p>
        </div>
        <button type="button" onClick={change} className="text-xs font-medium text-primary hover:underline">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <MapPin className="h-4 w-4 text-primary" />
        Deliver to
      </div>
      <form onSubmit={check} className="flex gap-2">
        <Input
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter pincode"
          inputMode="numeric"
          className="h-9 max-w-32 font-mono"
          aria-label="Delivery pincode"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pincode.length !== 6} className="gap-1.5">
          <Truck className="h-3.5 w-3.5" /> Check
        </Button>
      </form>
      <p className="mt-1.5 text-[11px] text-muted-foreground">Enter your pincode to check delivery date &amp; COD availability</p>
    </div>
  );
}
