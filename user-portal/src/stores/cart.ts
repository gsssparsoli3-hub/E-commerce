"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import type { CartItem } from "@/types";

type CartState = {
  items: CartItem[];
  loading: boolean;
  coupon: { code: string; discount: number } | null;
  count: () => number;
  subtotal: () => number;
  refresh: () => Promise<void>;
  add: (productId: string, quantity?: number) => Promise<boolean>;
  setQuantity: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  setCoupon: (coupon: { code: string; discount: number } | null) => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  coupon: null,

  count: () => get().items.reduce((s, i) => s + i.quantity, 0),
  subtotal: () => get().items.reduce((s, i) => s + i.product.price * i.quantity, 0),

  refresh: async () => {
    set({ loading: true });
    try {
      const res = await api<{ items: CartItem[] }>("/cart");
      set({ items: res.items });
    } finally {
      set({ loading: false });
    }
  },

  add: async (productId, quantity = 1) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useUiStore.getState().openAuth("login");
      return false;
    }
    try {
      const res = await api<{ items: CartItem[] }>("/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      set({ items: res.items });
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to cart");
      return false;
    }
  },

  setQuantity: async (itemId, quantity) => {
    try {
      const res = await api<{ items: CartItem[] }>("/cart", {
        method: "PUT",
        body: JSON.stringify({ itemId, quantity }),
      });
      set({ items: res.items });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update cart");
      get().refresh();
    }
  },

  remove: async (itemId) => {
    try {
      const res = await api<{ items: CartItem[] }>(`/cart?itemId=${itemId}`, { method: "DELETE" });
      set({ items: res.items });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove item");
    }
  },

  clear: async () => {
    try {
      const res = await api<{ items: CartItem[] }>("/cart?all=1", { method: "DELETE" });
      set({ items: res.items, coupon: null });
    } catch {
      // ignore
    }
  },

  setCoupon: (coupon) => set({ coupon }),
}));
