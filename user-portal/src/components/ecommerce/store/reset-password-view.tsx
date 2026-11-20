"use client";

import { useState } from "react";
import { KeyRound, Loader2, MailCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "../shared/empty-state";
import { api } from "@/lib/client-api";
import { useRoute, useRouterStore } from "@/stores/router";
import { useUiStore } from "@/stores/ui";
import { useDocumentTitle } from "@/hooks/use-document-title";

/**
 * Reset password view — reached from the "Reset your Shoperic password" email
 * via `#/reset-password?token=xxx`. The token is single-use and expires after
 * 1 hour; a missing or dead link falls back to the error state.
 */
export function ResetPasswordView() {
  const { query } = useRoute();
  const navigate = useRouterStore((s) => s.navigate);
  const openAuth = useUiStore((s) => s.openAuth);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deadLink, setDeadLink] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });

  const token = query.get("token")?.trim() || "";

  useDocumentTitle("Reset password");

  function goSignIn() {
    navigate("/");
    openAuth("login");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const res = await api<{ message?: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: form.password }),
      });
      setDone(true);
      toast.success(res.message || "Password updated — sign in with your new password");
      window.setTimeout(goSignIn, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not reset your password";
      if (/invalid or has expired/i.test(message)) {
        setDeadLink(true); // token missing, already used, or expired
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  // Missing token or a consumed/expired link — nothing to do here
  if (!token || deadLink) {
    return (
      <div className="mx-auto max-w-2xl px-3 py-5 sm:px-6 sm:py-8">
        <EmptyState
          icon={ShieldX}
          title="This reset link isn't valid"
          description="The link is missing its token, has already been used, or has expired. Request a new one from the sign-in dialog."
          actionLabel="Go to sign in"
          onAction={goSignIn}
        />
      </div>
    );
  }

  // Success — auto-redirect to sign-in shortly
  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-3 py-5 sm:px-6 sm:py-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-7 w-7 text-primary" />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight">Password updated</h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your new password — taking you there now…
            </p>
            <Button className="mt-2 w-full rounded-full" size="lg" onClick={goSignIn}>
              Go to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-5 sm:px-6 sm:py-8">
      <h1 className="mb-2 text-2xl font-extrabold tracking-tight">Reset your password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose a new password for your account. Your reset link is valid for 1 hour and can only be used once.
      </p>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="reset-password">New password</Label>
              <Input
                id="reset-password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reset-confirm">Confirm password</Label>
              <Input
                id="reset-confirm"
                type="password"
                required
                minLength={8}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
