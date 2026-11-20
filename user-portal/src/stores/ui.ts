"use client";

import { create } from "zustand";

type AuthMode = "login" | "register" | "forgot";

type UiState = {
  authModal: { open: boolean; mode: AuthMode };
  mobileNavOpen: boolean;
  openAuth: (mode?: AuthMode) => void;
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
