"use client";

import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "../shared/empty-state";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useUiStore } from "@/stores/ui";
import { useRouterStore } from "@/stores/router";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/format";
import type { Address, Order } from "@/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

export function CheckoutView() {
  const navigate = useRouterStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const openAuth = useUiStore((s) => s.openAuth);
  const { items, refresh, coupon, setCoupon } = useCartStore();
  const settings = useSettingsStore((s) => s.settings);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");
  const [placing, setPlacing] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "",
  });

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = settings
    ? (settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove ? 0 : subtotal > 0 ? settings.shippingFee : 0)
    : 0;
  const discount = coupon && coupon.discount <= subtotal ? coupon.discount : 0;
  const total = subtotal - discount + shipping;

  useEffect(() => {
    if (!user) return;
    api<{ addresses: Address[] }>("/addresses").then((r) => {
      setAddresses(r.addresses);
      const def = r.addresses.find((a) => a.isDefault) ?? r.addresses[0];
      if (def) setSelectedAddress(def.id);
      else setShowAddressForm(true);
    }).catch(() => null);
  }, [user]);

  useEffect(() => {
    if (settings?.razorpayEnabled && !settings?.codEnabled) setPaymentMethod("RAZORPAY");
    if (settings?.codEnabled && !settings?.razorpayEnabled) setPaymentMethod("COD");
  }, [settings]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={MapPin}
          title="Sign in to checkout"
          description="Sign in to save your addresses and track orders."
          actionLabel="Sign in"
          onAction={() => openAuth("login")}
        />
      </div>
    );
  }

  if (items.length === 0 && !placing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={Banknote}
          title="Nothing to checkout"
          description="Add some products to your cart first."
          actionLabel="Browse products"
          onAction={() => navigate("/shop")}
        />
      </div>
    );
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api<{ address: Address }>("/addresses", {
        method: "POST",
        body: JSON.stringify({ ...newAddress, isDefault: addresses.length === 0 }),
      });
      setAddresses((prev) => [res.address, ...prev]);
      setSelectedAddress(res.address.id);
      setShowAddressForm(false);
      setNewAddress({ fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
      toast.success("Address saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save address");
    }
  }

  async function placeOrder() {
    if (!selectedAddress) {
      toast.error("Please add a delivery address");
      setShowAddressForm(true);
      return;
    }
    setPlacing(true);
    try {
      const res = await api<{ order: Order; razorpay: { keyId: string; orderId: string; amount: number } | null }>(
        "/orders",
        {
          method: "POST",
          body: JSON.stringify({ addressId: selectedAddress, paymentMethod, couponCode: coupon?.code ?? null }),
        }
      );

      if (paymentMethod === "RAZORPAY" && res.razorpay) {
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) {
          toast.error("Could not load payment gateway. Please try again.");
          setPlacing(false);
          return;
        }
        const rzp = new window.Razorpay({
          key: res.razorpay.keyId,
          amount: res.razorpay.amount,
          currency: "INR",
          name: settings?.siteName ?? "Store",
          description: `Order ${res.order.orderNumber}`,
          order_id: res.razorpay.orderId,
          prefill: { name: user!.name, email: user!.email, contact: user!.phone ?? undefined },
          theme: { color: settings?.primaryColor ?? "#ea580c" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await api("/payments/razorpay/verify", { method: "POST", body: JSON.stringify(response) });
              await refresh();
              setCoupon(null);
              toast.success("Payment successful!", { description: `Order ${res.order.orderNumber} confirmed` });
              navigate("/orders");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Payment verification failed");
              navigate("/orders");
            }
          },
          modal: {
            ondismiss: () => {
              toast.info("Payment cancelled", { description: "Your order is saved as pending" });
              navigate("/orders");
            },
          },
        });
        rzp.open();
      } else {
        await refresh();
        setCoupon(null);
        toast.success("Order placed successfully!", { description: `Order ${res.order.orderNumber}` });
        navigate("/orders");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Checkout</h1>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {/* Address */}
          <section aria-labelledby="address-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="address-heading" className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                Delivery Address
              </h2>
              {addresses.length > 0 && !showAddressForm && (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowAddressForm(true)}>
                  <Plus className="h-3.5 w-3.5" /> New address
                </Button>
              )}
            </div>

            {showAddressForm ? (
              <Card>
                <CardContent>
                  <form onSubmit={saveAddress} className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="co-name">Full name</Label>
                      <Input id="co-name" required value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="co-phone">Phone</Label>
                      <Input id="co-phone" required type="tel" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} placeholder="+91 90000 00000" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="co-line1">Address line 1</Label>
                      <Input id="co-line1" required value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} placeholder="House no, street, area" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="co-line2">Address line 2 (optional)</Label>
                      <Input id="co-line2" value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} placeholder="Landmark" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="co-city">City</Label>
                      <Input id="co-city" required value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="co-state">State</Label>
                      <select
                        id="co-state"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
                      >
                        <option value="">Select state</option>
                        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="co-pincode">Pincode</Label>
                      <Input id="co-pincode" required pattern="\d{6}" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} placeholder="110016" />
                    </div>
                    <div className="flex items-end gap-2 sm:col-span-2">
                      <Button type="submit">Save address</Button>
                      {addresses.length > 0 && (
                        <Button type="button" variant="ghost" onClick={() => setShowAddressForm(false)}>
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
                      <p className="font-semibold">{a.fullName} {a.isDefault && <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">DEFAULT</span>}</p>
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

          {/* Payment */}
          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="mb-3 flex items-center gap-2 text-lg font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
              Payment Method
            </h2>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "COD" | "RAZORPAY")} className="grid gap-3">
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
        </div>

        {/* Summary */}
        <Card className="sticky top-36 lg:col-span-2">
          <CardContent className="space-y-4 p-5">
            <h2 className="font-bold">Your Order ({items.length} items)</h2>
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.product.images[0]} alt="" className="h-12 w-12 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatINR(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(subtotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Coupon ({coupon?.code})</span><span>−{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span></div>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
            <Button
              size="lg"
              className="w-full rounded-full"
              disabled={placing || (!settings?.codEnabled && !settings?.razorpayEnabled)}
              onClick={placeOrder}
            >
              {placing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</>
              ) : paymentMethod === "RAZORPAY" ? (
                <><CreditCard className="h-4 w-4" /> Pay {formatINR(total)}</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Place Order</>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              By placing this order you agree to our terms & refund policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
