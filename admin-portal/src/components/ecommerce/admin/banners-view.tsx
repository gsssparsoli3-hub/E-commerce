"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImageUploader } from "../shared/image-uploader";
import { api } from "@/lib/client-api";
import type { Banner } from "@/types";

export function AdminBannersView() {
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  function load() {
    api<{ banners: Banner[] }>("/admin/banners").then((r) => setBanners(r.banners)).catch(() => null);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(banner: Banner) {
    try {
      await api(`/admin/banners/${banner.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: banner.status === "ACTIVE" ? "HIDDEN" : "ACTIVE" }),
      });
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await api(`/admin/banners/${deleting.id}`, { method: "DELETE" });
      toast.success("Banner deleted");
      setDeleting(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Banners</h1>
        <p className="hidden text-sm text-muted-foreground sm:block">Homepage hero carousel slides</p>
        <Button className="ml-auto gap-1.5" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      </div>

      {!banners ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : banners.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No banners yet. Add your first hero banner.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <div className="relative aspect-[21/8] bg-muted">
                <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 p-4 text-white">
                  <p className="font-bold drop-shadow">{b.title}</p>
                  <p className="text-xs text-white/85 line-clamp-1">{b.subtitle}</p>
                </div>
                {b.status !== "ACTIVE" && (
                  <span className="absolute right-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] font-bold text-white">
                    HIDDEN
                  </span>
                )}
              </div>
              <CardContent className="flex items-center justify-between gap-2 p-3">
                <div className="text-xs text-muted-foreground">
                  <p className="font-mono">{b.link || "No link"}</p>
                  <p>Order: {b.sortOrder} · CTA: {b.ctaText}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(b)} aria-label="Toggle visibility">
                    {b.status === "ACTIVE" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(b)} aria-label="Edit banner">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(b)} aria-label="Delete banner">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-90 overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add Banner" : "Edit Banner"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <BannerForm
              banner={editing === "new" ? null : editing}
              onDone={() => { setEditing(null); load(); }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this banner?</AlertDialogTitle>
            <AlertDialogDescription>It will be removed from the homepage carousel.</AlertDialogDescription>
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

function BannerForm({ banner, onDone, onCancel }: { banner: Banner | null; onDone: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: banner?.title ?? "",
    subtitle: banner?.subtitle ?? "",
    image: banner?.image ?? "",
    link: banner?.link ?? "/shop",
    ctaText: banner?.ctaText ?? "Shop Now",
    position: banner?.position ?? "HERO",
    sortOrder: String(banner?.sortOrder ?? 0),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) || 0 };
      if (banner) {
        await api(`/admin/banners/${banner.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Banner updated");
      } else {
        await api("/admin/banners", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Banner created");
      }
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save banner");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="b-title">Title</Label>
        <Input id="b-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Mega Season Sale" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="b-subtitle">Subtitle</Label>
        <Input id="b-subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Up to 60% off sitewide" />
      </div>
      <div className="space-y-1.5">
        <Label>Image (21:9 recommended)</Label>
        <ImageUploader images={form.image ? [form.image] : []} onChange={(imgs) => setForm({ ...form, image: imgs[0] ?? "" })} max={1} single />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="b-link">Link (hash route)</Label>
          <Input id="b-link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/shop?category=electronics" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-cta">CTA text</Label>
          <Input id="b-cta" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Position</Label>
          <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="HERO">Hero carousel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-sort">Sort order</Label>
          <Input id="b-sort" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy}>{banner ? "Save" : "Create"}</Button>
      </div>
    </form>
  );
}
