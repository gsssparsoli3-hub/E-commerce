"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Loader2, MessageSquarePlus, Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarRating } from "../shared/star-rating";
import { EmptyState } from "../shared/empty-state";
import { api } from "@/lib/client-api";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { formatDate } from "@/lib/format";
import type { Review } from "@/types";

const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "top", label: "Top rated" },
  { value: "low", label: "Lowest rated" },
] as const;

export function ReviewSection({
  productId,
  reviews,
  rating,
  reviewCount,
  onReviewAdded,
}: {
  productId: string;
  reviews: Review[];
  rating: number;
  reviewCount: number;
  onReviewAdded: (review: Review) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const openAuth = useUiStore((s) => s.openAuth);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", comment: "" });
  const [sort, setSort] = useState<string>("recent");
  const [helpful, setHelpful] = useState<Record<string, number>>({});

  // Rating distribution: 5★ → 1★ counts
  const distribution = useMemo(() => {
    const dist = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.rating === star).length;
      return { star, count, pct: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0 };
    });
    return dist;
  }, [reviews]);

  // Sorted reviews
  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    if (sort === "recent") copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "top") copy.sort((a, b) => b.rating - a.rating);
    if (sort === "low") copy.sort((a, b) => a.rating - b.rating);
    return copy;
  }, [reviews, sort]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ review: Review }>("/reviews", { method: "POST", body: JSON.stringify({ productId, ...form }) });
      toast.success("Thanks for your review!");
      onReviewAdded(res.review);
      setFormOpen(false);
      setForm({ rating: 5, title: "", comment: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not post review");
    } finally {
      setBusy(false);
    }
  }

  function markHelpful(reviewId: string) {
    setHelpful((prev) => {
      const isMarked = prev[reviewId] !== undefined;
      if (isMarked) {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      }
      return { ...prev, [reviewId]: (reviews.find((r) => r.id === reviewId)?.helpful ?? 0) + 1 };
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight">Customer Reviews</h2>
        <Button variant="outline" className="gap-2" onClick={() => (user ? setFormOpen(!formOpen) : openAuth("login"))}>
          <MessageSquarePlus className="h-4 w-4" />
          {formOpen ? "Close" : "Write a review"}
        </Button>
      </div>

      {/* Rating summary + distribution */}
      {reviewCount > 0 && (
        <div className="mb-6 grid gap-6 rounded-xl border p-5 sm:grid-cols-[200px_1fr]">
          <div className="flex flex-col items-center justify-center border-b pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
            <p className="text-4xl font-extrabold">{rating}</p>
            <StarRating rating={rating} size={16} />
            <p className="mt-1 text-xs text-muted-foreground">{reviewCount} ratings</p>
          </div>
          <div className="space-y-1.5">
            {distribution.map((d) => (
              <button key={d.star} className="flex w-full items-center gap-2 text-xs hover:opacity-80" onClick={() => { /* could filter by star */ }}>
                <span className="flex w-8 items-center gap-0.5 font-medium">
                  {d.star}<Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-10 text-right text-muted-foreground">{d.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {formOpen && user && (
        <Card className="mb-6">
          <CardContent className="space-y-4 p-5">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Your rating</Label>
                <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} type="button" role="radio" aria-checked={form.rating === r} aria-label={`${r} star${r > 1 ? "s" : ""}`}
                      onClick={() => setForm({ ...form, rating: r })}>
                      <Star className={`h-6 w-6 transition-colors ${r <= form.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-title">Title (optional)</Label>
                <Input id="review-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Sum up your experience" maxLength={80} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-comment">Review</Label>
                <Textarea id="review-comment" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="What did you like or dislike?" required minLength={4} maxLength={1000} rows={3} />
              </div>
              <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Submit review</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sort + list */}
      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="Share your thoughts to help other shoppers." />
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Showing {sortedReviews.length} reviews</span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="max-h-[600px] space-y-4 overflow-y-auto pr-1">
            {sortedReviews.filter((r) => r.user).map((review) => (
              <div key={review.id} className="rounded-xl border p-4">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(review.user?.name ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{review.user?.name ?? "Customer"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                {review.verifiedPurchase && (
                  <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <BadgeCheck className="h-3 w-3" /> Verified Purchase
                  </span>
                )}
                {review.title && <p className="text-sm font-semibold">{review.title}</p>}
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                <Separator className="mt-3 opacity-50" />
                <button
                  type="button"
                  onClick={() => markHelpful(review.id)}
                  className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${helpful[review.id] !== undefined ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> Helpful {helpful[review.id] !== undefined ? `(${helpful[review.id]})` : ""}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
