"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "../shared/image-uploader";
import { api } from "@/lib/client-api";
import type { Category, Product } from "@/types";

export function ProductForm({
  product,
  categories,
  onDone,
  onCancel,
}: {
  product: Product | null;
  categories: Category[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price / 100) : "",
    mrp: product ? String(product.mrp / 100) : "",
    stock: product ? String(product.stock) : "0",
    sku: product?.sku ?? "",
    categoryId: product?.category.id ?? categories[0]?.id ?? "",
    images: product?.images ?? [] as string[],
    tags: (product?.tags ?? []).join(", "),
    brand: product?.brand ?? "",
    warranty: product?.warranty ?? "",
    highlights: (product?.highlights ?? []).join("\n"),
    featured: product?.featured ?? false,
    status: product?.status ?? "ACTIVE",
  });
  // Specs: array of {key, value} pairs for easy editing
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(() => {
    const obj = product?.specifications ?? {};
    return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error("Create a category first");
      return;
    }
    setBusy(true);
    try {
      const specsObj: Record<string, string> = {};
      specs.forEach((s) => { if (s.key.trim()) specsObj[s.key.trim()] = s.value.trim(); });
      const payload = {
        name: form.name,
        description: form.description,
        price: Math.round(Number(form.price) * 100),
        mrp: Math.round(Number(form.mrp || form.price) * 100),
        stock: Number(form.stock) || 0,
        sku: form.sku || undefined,
        categoryId: form.categoryId,
        images: form.images,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        brand: form.brand || undefined,
        warranty: form.warranty || undefined,
        highlights: form.highlights.split("\n").map((h) => h.trim()).filter(Boolean),
        specifications: specsObj,
        featured: form.featured,
        status: form.status,
      };
      if (product) {
        await api(`/admin/products/${product.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Product updated");
      } else {
        await api("/admin/products", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Product created");
      }
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save product");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="p-name">Product name</Label>
        <Input id="p-name" required minLength={3} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. SonicWave Pro Headphones" />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="p-desc">Description</Label>
        <Textarea id="p-desc" required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full product description customers will see…" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-price">Selling price (₹)</Label>
        <Input id="p-price" required type="number" min="1" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="2999" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-mrp">MRP (₹)</Label>
        <Input id="p-mrp" type="number" min="1" step="0.01" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} placeholder="4999" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-stock">Stock quantity</Label>
        <Input id="p-stock" required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-sku">SKU (optional)</Label>
        <Input id="p-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generated if empty" />
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active (visible in store)</SelectItem>
            <SelectItem value="DRAFT">Draft (hidden)</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label>Images</Label>
        <ImageUploader images={form.images} onChange={(images) => setForm({ ...form, images })} max={6} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-brand">Brand</Label>
        <Input id="p-brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. SonicWave" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-warranty">Warranty</Label>
        <Input id="p-warranty" value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} placeholder="e.g. 1 year manufacturer warranty" />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="p-tags">Tags (comma separated)</Label>
        <Input id="p-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="audio, wireless, bestseller" />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="p-highlights">Key highlights (one per line)</Label>
        <Textarea id="p-highlights" rows={4} value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} placeholder={"40-hour battery life\nActive noise cancellation\nBluetooth 5.3"} />
        <p className="text-xs text-muted-foreground">Shown as bullet points on the product page</p>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label>Specifications</Label>
        <div className="space-y-2 rounded-lg border p-3">
          {specs.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input className="flex-1" placeholder="Key (e.g. Color)" value={s.key} onChange={(e) => setSpecs(specs.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} />
              <Input className="flex-1" placeholder="Value (e.g. Black)" value={s.value} onChange={(e) => setSpecs(specs.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
              <Button type="button" variant="outline" size="icon" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} aria-label="Remove spec">&times;</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setSpecs([...specs, { key: "", value: "" }])}>+ Add spec</Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          <Label htmlFor="p-featured" className="cursor-pointer">Show in Featured section</Label>
        </div>
        <Switch id="p-featured" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
      </div>

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
