"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import type { Category } from "@/types";

export function AdminCategoriesView() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  function load() {
    api<{ categories: Category[] }>("/admin/categories").then((r) => setCategories(r.categories)).catch(() => null);
  }

  useEffect(() => { load(); }, []);

  async function remove() {
    if (!deleting) return;
    try {
      await api(`/admin/categories/${deleting.id}`, { method: "DELETE" });
      toast.success("Category deleted");
      setDeleting(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Categories</h1>
        <Button className="ml-auto gap-1.5" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {!categories ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-100 text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Slug</th>
                    <th className="p-3 font-medium">Products</th>
                    <th className="p-3 font-medium">Visible</th>
                    <th className="p-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img src={c.image ?? "/brand/logo.png"} alt="" className="h-10 w-10 rounded-md object-cover" />
                          <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="line-clamp-1 max-w-56 text-xs text-muted-foreground">{c.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                      <td className="p-3 font-semibold">{c.productCount}</td>
                      <td className="p-3">{c.status === "ACTIVE" ? "✅" : "🚫"}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(c)} aria-label="Edit category">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(c)} aria-label="Delete category" disabled={c.productCount > 0}>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add Category" : "Edit Category"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <CategoryForm
              category={editing === "new" ? null : editing}
              onDone={() => { setEditing(null); load(); }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Categories with products cannot be deleted. Move the products first.</AlertDialogDescription>
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

function CategoryForm({
  category, onDone, onCancel,
}: {
  category: Category | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: category?.name ?? "",
    description: category?.description ?? "",
    image: category?.image ?? null,
    sortOrder: String(category?.sortOrder ?? 0),
    visible: category ? category.status === "ACTIVE" : true,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        image: form.image,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.visible ? "ACTIVE" : "HIDDEN",
      };
      if (category) {
        await api(`/admin/categories/${category.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Category updated");
      } else {
        await api("/admin/categories", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Category created");
      }
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Name</Label>
        <Input id="c-name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Electronics" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-desc">Description</Label>
        <Textarea id="c-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description shown on the category card" />
      </div>
      <div className="space-y-1.5">
        <Label>Image</Label>
        <ImageUploader images={form.image ? [form.image] : []} onChange={(imgs) => setForm({ ...form, image: imgs[0] ?? null })} max={1} single />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-sort">Sort order</Label>
          <Input id="c-sort" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
        </div>
        <div className="flex items-center justify-between self-end rounded-lg border px-3 py-2">
          <Label htmlFor="c-visible" className="cursor-pointer">Visible</Label>
          <Switch id="c-visible" checked={form.visible} onCheckedChange={(v) => setForm({ ...form, visible: v })} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy}>{category ? "Save" : "Create"}</Button>
      </div>
    </form>
  );
}
