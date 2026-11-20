"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquare, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "../shared/status-badge";
import { Pagination } from "../shared/pagination";
import { api } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";

/** Inline 1-5 star display (read-only). */
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i < rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}
        />
      ))}
    </span>
  );
}

type AdminReview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  product: { id: string; name: string; slug: string };
};

type ListResponse = { reviews: AdminReview[]; pagination: { page: number; pages: number; total: number } };

export function AdminReviewsView() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  function load() {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status !== "all") params.set("status", status);
    api<ListResponse>(`/admin/reviews?${params}`).then(setData).catch(() => null);
  }

  useEffect(() => { load(); }, [page, status]);

  async function toggleStatus(review: AdminReview) {
    const next = review.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    try {
      await api(`/admin/reviews/${review.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      toast.success(next === "PUBLISHED" ? "Review published" : "Review hidden");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  async function remove(review: AdminReview) {
    if (!confirm(`Delete review by ${review.user.name}? This cannot be undone.`)) return;
    try {
      await api(`/admin/reviews/${review.id}`, { method: "DELETE" });
      toast.success("Review deleted");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Reviews</h1>
        {data && <span className="text-sm text-muted-foreground">({data.pagination.total} total)</span>}
        <div className="ml-auto">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reviews</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="HIDDEN">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : data.reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 p-12 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 opacity-40" />
            <p>No reviews yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((r) => (
            <Card key={r.id} className={r.status === "HIDDEN" ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={r.rating} size={14} />
                      {r.title && <span className="text-sm font-semibold">{r.title}</span>}
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1.5 text-sm text-foreground">{r.comment}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span><strong>{r.user.name}</strong> · {r.user.email}</span>
                      <span>on <strong>{r.product.name}</strong></span>
                      <span>{formatDateTime(r.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button
                      size="sm"
                      variant={r.status === "PUBLISHED" ? "outline" : "secondary"}
                      className="gap-1.5"
                      onClick={() => toggleStatus(r)}
                    >
                      {r.status === "PUBLISHED" ? "Hide" : <><CheckCircle2 className="h-3.5 w-3.5" /> Publish</>}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(r)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />}
    </div>
  );
}
