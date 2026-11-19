"use client";

import { useEffect, useState } from "react";
import { KeyRound, LogOut, MapPin, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "../shared/empty-state";
import { api } from "@/lib/client-api";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { useRouterStore } from "@/stores/router";
import type { Address } from "@/types";

const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

export function ProfileView() {
  const navigate = useRouterStore((s) => s.navigate);
  const { user, logout, updateProfile } = useAuthStore();
  const openAuth = useUiStore((s) => s.openAuth);

  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile({ name: user.name, phone: user.phone ?? "" });
    api<{ addresses: Address[] }>("/addresses").then((r) => setAddresses(r.addresses)).catch(() => null);
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={UserRound}
          title="Sign in to manage your profile"
          actionLabel="Sign in"
          onAction={() => openAuth("login")}
        />
      </div>
    );
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ name: profile.name, phone: profile.phone });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ currentPassword: passwords.current, newPassword: passwords.next });
      toast.success("Password changed");
      setPasswords({ current: "", next: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change password");
    } finally {
      setBusy(false);
    }
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingAddress) {
        const res = await api<{ address: Address }>("/addresses", {
          method: "PUT",
          body: JSON.stringify({ id: editingAddress, ...form }),
        });
        setAddresses((prev) => prev.map((a) => (a.id === editingAddress ? res.address : a)));
        toast.success("Address updated");
      } else {
        const res = await api<{ address: Address }>("/addresses", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setAddresses((prev) => [res.address, ...prev]);
        toast.success("Address added");
      }
      setShowForm(false);
      setEditingAddress(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save address");
    }
  }

  async function deleteAddress(id: string) {
    try {
      await api(`/addresses?id=${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove address");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 py-5 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">My Account</h1>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pf-name">Full name</Label>
              <Input id="pf-name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required minLength={2} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pf-email">Email</Label>
              <Input id="pf-email" value={user.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pf-phone">Phone</Label>
              <Input id="pf-phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 90000 00000" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busy}>Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="pf-pass-current">Current password</Label>
              <Input id="pf-pass-current" type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required autoComplete="current-password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pf-pass-next">New password</Label>
              <Input id="pf-pass-next" type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required minLength={6} autoComplete="new-password" />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="secondary" disabled={busy || !passwords.current || !passwords.next}>
                Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" /> Saved Addresses
          </CardTitle>
          {!showForm && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => { setShowForm(true); setEditingAddress(null); setForm({ fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" }); }}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <form onSubmit={saveAddress} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="ad-name">Full name</Label>
                <Input id="ad-name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ad-phone">Phone</Label>
                <Input id="ad-phone" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ad-line1">Address line 1</Label>
                <Input id="ad-line1" required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ad-line2">Address line 2 (optional)</Label>
                <Input id="ad-line2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ad-city">City</Label>
                <Input id="ad-city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ad-state">State</Label>
                <select id="ad-state" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs">
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ad-pincode">Pincode</Label>
                <Input id="ad-pincode" required pattern="\d{6}" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit">{editingAddress ? "Update" : "Save"} address</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingAddress(null); }}>Cancel</Button>
              </div>
            </form>
          )}

          {addresses.length === 0 && !showForm ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No saved addresses yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((a) => (
                <div key={a.id} className="rounded-lg border p-3.5 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{a.fullName} {a.isDefault && <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">DEFAULT</span>}</p>
                      <p className="mt-1 text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}</p>
                      <p className="mt-0.5 text-muted-foreground">{a.phone}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit address"
                        onClick={() => {
                          setEditingAddress(a.id);
                          setShowForm(true);
                          setForm({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode });
                        }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label="Delete address" onClick={() => deleteAddress(a.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Separator />
          <Button
            variant="ghost"
            className="w-full justify-center gap-2 text-destructive hover:text-destructive"
            onClick={async () => {
              await logout();
              navigate("/");
              toast.success("Signed out");
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
