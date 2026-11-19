"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import type { Product } from "@/types";

type WishlistState = {
  ids: string[];
  products: Product[];
  has: (productId: string) => boolean;
  refresh: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: [],
  products: [],

  has: (productId) => get().ids.includes(productId),

  refresh: async () => {
    try {
      const res = await api<{ items: { product: Product }[] }>("/wishlist");
      set({
        products: res.items.map((i) => i.product),
        ids: res.items.map((i) => i.product.id),
      });
    } catch {
      set({ ids: [], products: [] });
    }
  },

  toggle: async (productId) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useUiStore.getState().openAuth("login");
      return;
    }
    const wasAdded = get().ids.includes(productId);
    // optimistic
    set((s) => ({
      ids: wasAdded ? s.ids.filter((id) => id !== productId) : [...s.ids, productId],
      products: wasAdded ? s.products.filter((p) => p.id !== productId) : s.products,
    }));
    try {
      await api("/wishlist", { method: "POST", body: JSON.stringify({ productId }) });
      toast.success(wasAdded ? "Removed from wishlist" : "Saved to wishlist");
      // sync the full product list — the wishlist page renders `products`
      await get().refresh();
    } catch (error) {
      get().refresh();
      toast.error(error instanceof Error ? error.message : "Could not update wishlist");
    }
  },
}));
