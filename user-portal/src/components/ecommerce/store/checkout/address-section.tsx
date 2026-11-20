"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { INDIAN_STATES, isValidPincode } from "./razorpay";
import type { Address } from "@/types";

type NewAddress = {
  fullName: string; phone: string; line1: string; line2: string;
  city: string; state: string; pincode: string;
};

/**
 * Address section — list of saved addresses + new-address form.
 * Owned by the parent (CheckoutView) which passes state + handlers down.
 */
export function AddressSection({
  addresses,
  selectedAddress,
  setSelectedAddress,
  showForm,
  setShowForm,
  newAddress,
  setNewAddress,
  onSave,
}: {
  addresses: Address[];
  selectedAddress: string;
  setSelectedAddress: (id: string) => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  newAddress: NewAddress;
  setNewAddress: (a: NewAddress) => void;
  onSave: (e: React.FormEvent) => void;
}) {
  return (
    <section aria-labelledby="address-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="address-heading" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
          Delivery Address
        </h2>
        {addresses.length > 0 && !showForm && (
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> New address
          </Button>
        )}
      </div>

      {showForm ? (
        <Card>
          <CardContent>
            <form onSubmit={onSave} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="co-name">Full name</Label>
                <Input
                  id="co-name" required value={newAddress.fullName}
                  onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-phone">Phone</Label>
                <Input
                  id="co-phone" required type="tel" value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  placeholder="+91 90000 00000"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="co-line1">Address line 1</Label>
                <Input
                  id="co-line1" required value={newAddress.line1}
                  onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                  placeholder="House no, street, area"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="co-line2">Address line 2 (optional)</Label>
                <Input
                  id="co-line2" value={newAddress.line2}
                  onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                  placeholder="Landmark"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-city">City</Label>
                <Input
                  id="co-city" required value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-state">State</Label>
                <select
                  id="co-state" required value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="co-pincode">Pincode</Label>
                <Input
                  id="co-pincode" required pattern={isValidPincode(newAddress.pincode) ? "\\d{6}" : ".*"}
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  placeholder="110016"
                />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2">
                <Button type="submit">Save address</Button>
                {addresses.length > 0 && (
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading addresses…</p>
      ) : (
        <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress} className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <Label
              key={a.id}
              htmlFor={`addr-${a.id}`}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                selectedAddress === a.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={a.id} id={`addr-${a.id}`} className="mt-0.5" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">
                  {a.fullName}{" "}
                  {a.isDefault && (
                    <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">DEFAULT</span>
                  )}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                </p>
                <p className="mt-0.5 text-muted-foreground">{a.phone}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      )}
    </section>
  );
}
