"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/client-api";
import { formatDate, formatINR } from "@/lib/format";
import type { Coupon } from "@/types";

export function AdminCouponsView() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  function load() {
    api<{ coupons: Coupon[] }>("/admin/coupons").then((r) => setCoupons(r.coupons)).catch(() => null);
  }

  useEffect(() => { load(); }, []);

  async function toggle(coupon: Coupon) {
    try {
      await api(`/admin/coupons/${coupon.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: coupon.status === "ACTIVE" ? "DISABLED" : "ACTIVE" }),
      });
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await api(`/admin/coupons/${deleting.id}`, { method: "DELETE" });
      toast.success("Coupon deleted");
      setDeleting(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Coupons</h1>
        <Button className="ml-auto gap-1.5" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Add Coupon
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {!coupons ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : coupons.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No coupons yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-125 text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3 font-medium">Code</th>
                    <th className="p-3 font-medium">Discount</th>
                    <th className="p-3 font-medium">Min order</th>
                    <th className="p-3 font-medium">Usage</th>
                    <th className="p-3 font-medium">Expires</th>
                    <th className="p-3 font-medium">Enabled</th>
                    <th className="p-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="p-3">
                        <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-xs font-bold text-primary">
                          {c.code}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">
                        {c.type === "PERCENT" ? `${c.value}%` : formatINR(c.value)}
                        {c.maxDiscount && <span className="block text-xs font-normal text-muted-foreground">up to {formatINR(c.maxDiscount)}</span>}
                      </td>
                      <td className="p-3 text-muted-foreground">{formatINR(c.minOrder)}</td>
                      <td className="p-3 text-muted-foreground">
                        {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}
                      </td>
                      <td className="p-3 text-muted-foreground">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</td>
                      <td className="p-3">
                        <Switch checked={c.status === "ACTIVE"} onCheckedChange={() => toggle(c)} aria-label={`Toggle ${c.code}`} />
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(c)} aria-label="Edit coupon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(c)} aria-label="Delete coupon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" /> {editing === "new" ? "Add Coupon" : "Edit Coupon"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <CouponForm
              coupon={editing === "new" ? null : editing}
              onDone={() => { setEditing(null); load(); }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>Customers will no longer be able to apply it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={(e) => { e.preventDefault(); remove(); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CouponForm({ coupon, onDone, onCancel }: { coupon: Coupon | null; onDone: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: coupon?.code ?? "",
    type: coupon?.type ?? "PERCENT",
    value: coupon ? String(coupon.type === "PERCENT" ? coupon.value : coupon.value / 100) : "",
    minOrder: coupon ? String(coupon.minOrder / 100) : "0",
    maxDiscount: coupon?.maxDiscount ? String(coupon.maxDiscount / 100) : "",
    usageLimit: coupon?.usageLimit ? String(coupon.usageLimit) : "",
    expiresAt: coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: form.type === "PERCENT" ? Number(form.value) : Math.round(Number(form.value) * 100),
        minOrder: Math.round(Number(form.minOrder || 0) * 100),
        maxDiscount: form.maxDiscount ? Math.round(Number(form.maxDiscount) * 100) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
      };
      if (coupon) {
        await api(`/admin/coupons/${coupon.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Coupon updated");
      } else {
        await api("/admin/coupons", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Coupon created");
      }
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save coupon");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cp-code">Code</Label>
          <Input id="cp-code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">Percentage (%)</SelectItem>
              <SelectItem value="FLAT">Flat amount (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cp-value">
            {form.type === "PERCENT" ? "Discount %" : "Discount ₹"}
          </Label>
          <Input id="cp-value" required type="number" min="1" step={form.type === "PERCENT" ? "1" : "0.01"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-min">Min order ₹</Label>
          <Input id="cp-min" type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cp-max">Max discount ₹ {form.type === "FLAT" && "(n/a)"}</Label>
          <Input id="cp-max" type="number" min="0" disabled={form.type === "FLAT"} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="No cap" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-limit">Usage limit</Label>
          <Input id="cp-limit" type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cp-expiry">Expiry date</Label>
        <Input id="cp-expiry" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy}>{coupon ? "Save" : "Create"}</Button>
      </div>
    </form>
  );
}
