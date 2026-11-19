"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "../shared/status-badge";
import { Pagination } from "../shared/pagination";
import { ProductForm } from "./product-form";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/format";
import type { Category, Product } from "@/types";

type ListResponse = { products: Product[]; pagination: { page: number; pages: number; total: number } };

export function AdminProductsView() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  function load() {
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    api<ListResponse>(`/admin/products?${params}`).then(setData).catch(() => null);
  }

  useEffect(() => {
    load();
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    api<{ categories: Category[] }>("/admin/categories").then((r) => setCategories(r.categories)).catch(() => null);
  }, []);

  async function toggleFeatured(product: Product) {
    try {
      await api(`/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ featured: !product.featured }),
      });
      toast.success(product.featured ? "Removed from featured" : "Marked as featured");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      const res = await api<{ archived: boolean }>(`/admin/products/${deleting.id}`, { method: "DELETE" });
      toast.success(res.archived ? "Product archived (has order history)" : "Product deleted");
      setDeleting(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Products</h1>
        <Button className="ml-auto gap-1.5" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or SKU…"
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {!data ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3 font-medium">Product</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Price</th>
                    <th className="p-3 font-medium">Stock</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 text-center font-medium">Featured</th>
                    <th className="p-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.id} className="border-b transition-colors last:border-0 hover:bg-muted/40">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img src={p.images[0]} alt="" className="h-10 w-10 rounded-md object-cover" />
                          <div className="min-w-0">
                            <p className="line-clamp-1 max-w-56 font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{p.category.name}</td>
                      <td className="p-3 font-semibold">{formatINR(p.price)}</td>
                      <td className="p-3">
                        <span className={p.stock <= 5 ? "font-bold text-red-600" : ""}>{p.stock}</span>
                      </td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                      <td className="p-3 text-center">
                        <Switch checked={p.featured} onCheckedChange={() => toggleFeatured(p)} aria-label={`Toggle featured for ${p.name}`} />
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(p)} aria-label="Edit product">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(p)} aria-label="Delete product">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.products.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data && (
        <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
      )}

      {/* Editor dialog */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-90 overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add Product" : "Edit Product"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <ProductForm
              product={editing === "new" ? null : editing}
              categories={categories}
              onDone={() => { setEditing(null); load(); }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the product from your store. Products with order history are archived instead to keep records intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); remove(); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
