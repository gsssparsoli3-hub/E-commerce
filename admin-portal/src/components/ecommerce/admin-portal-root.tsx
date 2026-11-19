"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, LogIn, ShieldAlert, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminApp } from "./admin/admin-app";
import { SplashScreen } from "./shared/splash-screen";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

/**
 * Root of the standalone admin portal:
 * splash -> login gate -> admin role check -> AdminApp.
 */
export function AdminPortalRoot() {
  const fetchSettings = useSettingsStore((s) => s.fetch);
  const settings = useSettingsStore((s) => s.settings);
  const settingsReady = useSettingsStore((s) => s.ready);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.ready);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    fetchSettings();
    fetchMe();
  }, []);

  if (!settingsReady || !authReady) return <SplashScreen />;

  if (!user) return <LoginScreen />;

  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-xl font-bold">Not an administrator</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          You are signed in as <span className="font-semibold">{user.email}</span>, but this
          console is restricted to administrator accounts.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const url = settings?.storeUrl || "/";
              if (url.startsWith("/")) window.location.href = url;
              else window.open(url, "_blank");
            }}
          >
            <Store className="h-4 w-4" /> Back to store
          </Button>
          <Button variant="ghost" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <AdminApp />;
}

function LoginScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const login = useAuthStore((s) => s.login);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== "ADMIN") {
        toast.error("This account is not an administrator");
      } else {
        toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="h-14 w-14 rounded-2xl object-contain" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Lock className="h-6 w-6" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {settings?.siteName ?? "Store"} Admin
            </h1>
            <p className="text-sm text-muted-foreground">Sign in to the control center</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border bg-background p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4" /> Sign in</>}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Administrator accounts only. Customers shop at the store.
        </p>
      </div>
    </div>
  );
}
