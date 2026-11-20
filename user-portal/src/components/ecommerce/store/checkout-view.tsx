"use client";

import { useEffect, useState } from "react";
import { Banknote, MapPin } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "../shared/empty-state";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useUiStore } from "@/stores/ui";
import { useRouterStore } from "@/stores/router";
import { api } from "@/lib/client-api";
import type { Address, Order } from "@/types";
import { loadRazorpayScript } from "./checkout/razorpay";
import { AddressSection } from "./checkout/address-section";
import { PaymentSection } from "./checkout/payment-section";
import { OrderSummary, computeShipping, computeDiscount } from "./checkout/order-summary";

/**
 * Checkout orchestrator — owns state + the place-order flow (including the
 * Razorpay gateway handshake). Visual sections live in ./checkout/*.tsx.
 */
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
  const shipping = computeShipping(subtotal, settings);
  const discount = computeDiscount(coupon, subtotal);
  const total = subtotal - discount + shipping;

  useEffect(() => {
    if (!user) return;
    api<{ addresses: Address[] }>("/addresses")
      .then((r) => {
        setAddresses(r.addresses);
        const def = r.addresses.find((a) => a.isDefault) ?? r.addresses[0];
        if (def) setSelectedAddress(def.id);
        else setShowAddressForm(true);
      })
      .catch(() => null);
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
          <AddressSection
            addresses={addresses}
            selectedAddress={selectedAddress}
            setSelectedAddress={setSelectedAddress}
            showForm={showAddressForm}
            setShowForm={setShowAddressForm}
            newAddress={newAddress}
            setNewAddress={setNewAddress}
            onSave={saveAddress}
          />
          <PaymentSection
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            settings={settings}
          />
        </div>

        <OrderSummary
          items={items}
          subtotal={subtotal}
          discount={discount}
          shipping={shipping}
          total={total}
          couponCode={coupon?.code}
          paymentMethod={paymentMethod}
          placing={placing}
          disabled={placing || (!settings?.codEnabled && !settings?.razorpayEnabled)}
          onPlace={placeOrder}
        />
      </div>
    </div>
  );
}
