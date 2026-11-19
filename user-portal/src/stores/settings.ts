"use client";

import { create } from "zustand";
import { api } from "@/lib/client-api";
import type { SiteSettings } from "@/types";

type SettingsState = {
  settings: SiteSettings | null;
  ready: boolean;
  fetch: () => Promise<SiteSettings | null>;
  applyColor: (hex: string) => void;
};

/** Convert hex -> oklch so shadcn theme vars stay consistent. */
function hexToOklch(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  // Convert HSL -> OKLCH approximation (good enough for theming)
  const c = s * (1 - Math.abs(2 * l - 1));
  const okL = 0.5 + (l - 0.5) * 0.78 + 0.1 * s;
  const okC = Math.min(0.25, c * 0.7 + s * 0.06);
  const hueDeg = Math.round(h * 360);
  return `oklch(${okL.toFixed(3)} ${okC.toFixed(3)} ${hueDeg})`;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  ready: false,

  fetch: async () => {
    try {
      const res = await api<{ settings: SiteSettings }>("/settings");
      set({ settings: res.settings, ready: true });
      get().applyColor(res.settings.primaryColor);
      return res.settings;
    } catch {
      set({ ready: true });
      return null;
    }
  },

  applyColor: (hex) => {
    if (typeof document === "undefined" || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", hexToOklch(hex));
    root.style.setProperty("--ring", hexToOklch(hex));
    // Derive a slightly darker shade for sidebar-primary etc.
    root.style.setProperty("--sidebar-primary", hexToOklch(hex));
  },
}));
