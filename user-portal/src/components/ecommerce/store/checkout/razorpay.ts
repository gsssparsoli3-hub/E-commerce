"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/** Lazy-load the Razorpay checkout.js script (idempotent — safe to call repeatedly). */
export function loadRazorpayScript(): Promise<boolean> {
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

/** List of Indian states for address forms. */
export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

/** Empty address form state — used by checkout + profile. */
export function useEmptyAddress() {
  const [addr, setAddr] = useState({
    fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "",
  });
  function reset() {
    setAddr({ fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
  }
  return { addr, setAddr, reset };
}

/** Pincode validation hook — 6 digits, Indian format. */
export function isValidPincode(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/** Phone validation — 10 digits (Indian mobile). */
export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s-]{10,15}$/.test(phone);
}

/** Re-revalidate Razorpay availability on a debounce (used for debugging). */
export function useRazorpayReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadRazorpayScript().then(setReady);
  }, []);
  return ready;
}
