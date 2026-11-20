"use client";

import { useState } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";

export function AuthModal() {
  const { authModal, closeAuth, openAuth } = useUiStore();
  const { login, register } = useAuthStore();
  const refreshCart = useCartStore((s) => s.refresh);
  const refreshWishlist = useWishlistStore((s) => s.refresh);

  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });

  const mode = authModal.mode;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const user = await login(form.email, form.password);
        toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      } else {
        const user = await register(form.name, form.email, form.password, form.phone || undefined);
        toast.success(`Account created — welcome, ${user.name.split(" ")[0]}!`);
      }
      closeAuth();
      setForm({ name: "", email: "", password: "", phone: "" });
      await Promise.all([refreshCart(), refreshWishlist()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={authModal.open} onOpenChange={(open) => (open ? null : closeAuth())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Sign in to your account to continue shopping."
              : "Join us today — it takes less than a minute."}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-2 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1" role="tablist">
          <button
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => openAuth("login")}
            className={`rounded-md py-2 text-sm font-semibold transition-colors ${
              mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => openAuth("register")}
            className={`rounded-md py-2 text-sm font-semibold transition-colors ${
              mode === "register" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Full name</Label>
              <Input
                id="auth-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Priya Sharma"
                required
                minLength={2}
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-phone">Phone (optional)</Label>
              <Input
                id="auth-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 90000 00000"
                autoComplete="tel"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              <><LogIn className="h-4 w-4" /> Sign in</>
            ) : (
              <><UserPlus className="h-4 w-4" /> Create account</>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {mode === "login"
            ? "New here? Switch to Register — it takes less than a minute."
            : "Already have an account? Switch to Sign in."}
        </p>
      </DialogContent>
    </Dialog>
  );
}
