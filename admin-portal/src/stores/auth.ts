"use client";

import { create } from "zustand";
import { api } from "@/lib/client-api";
import type { User } from "@/types";

type AuthResponse = { user: User; token?: string };

type AuthState = {
  user: User | null;
  ready: boolean;
  fetchMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) => Promise<User>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,

  fetchMe: async () => {
    try {
      const res = await api<{ user: User }>("/auth/me");
      set({ user: res.user, ready: true });
    } catch {
      set({ user: null, ready: true });
    }
  },

  login: async (email, password) => {
    const res = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    set({ user: res.user });
    return res.user;
  },

  register: async (name, email, password, phone) => {
    const res = await api<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    });
    set({ user: res.user });
    return res.user;
  },

  logout: async () => {
    await api("/auth/logout", { method: "POST" });
    set({ user: null });
  },

  updateProfile: async (data) => {
    const res = await api<{ user: User }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    set({ user: res.user });
    return res.user;
  },
}));
