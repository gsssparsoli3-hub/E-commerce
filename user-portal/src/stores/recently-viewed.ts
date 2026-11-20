"use client";

import { create } from "zustand";

const KEY = "recently-viewed";
const MAX = 8;

export type RecentProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  image: string;
};

type RecentlyViewedState = {
  items: RecentProduct[];
  add: (p: RecentProduct) => void;
  clear: () => void;
  hydrate: () => void;
};

function read(): RecentProduct[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as RecentProduct[];
  } catch {
    return [];
  }
}

function write(items: RecentProduct[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
}

export const useRecentlyViewedStore = create<RecentlyViewedState>((set, get) => ({
  items: [],
  hydrate: () => { if (get().items.length === 0) set({ items: read() }); },
  add: (p) => {
    const next = [p, ...get().items.filter((i) => i.id !== p.id)].slice(0, MAX);
    write(next);
    set({ items: next });
  },
  clear: () => { write([]); set({ items: [] }); },
}));
