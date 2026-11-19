"use client";

import { create } from "zustand";

type UiState = {
  authModal: { open: boolean; mode: "login" | "register" };
  mobileNavOpen: boolean;
  openAuth: (mode?: "login" | "register") => void;
  closeAuth: () => void;
  setMobileNav: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  authModal: { open: false, mode: "login" },
  mobileNavOpen: false,
  openAuth: (mode = "login") => set({ authModal: { open: true, mode } }),
  closeAuth: () => set({ authModal: { open: false, mode: "login" } }),
  setMobileNav: (open) => set({ mobileNavOpen: open }),
}));
