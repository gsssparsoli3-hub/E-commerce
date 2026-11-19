"use client";

import { useState } from "react";
import { Loader2, MessageSquarePlus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "../shared/star-rating";
import { EmptyState } from "../shared/empty-state";
import { api } from "@/lib/client-api";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { formatDate } from "@/lib/format";
import type { Review } from "@/types";

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ review: Review }>("/reviews", {
        method: "POST",
        body: JSON.stringify({ productId, ...form }),
      });
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

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Customer Reviews</h2>
          {reviewCount > 0 ? (
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={rating} count={reviewCount} />
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No reviews yet — be the first!</p>
          )}
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => (user ? setFormOpen(!formOpen) : openAuth("login"))}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {formOpen ? "Close" : "Write a review"}
        </Button>
      </div>

      {/* Form */}
      {formOpen && user && (
        <Card className="mb-6">
          <CardContent className="space-y-4">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Your rating</Label>
                <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={form.rating === r}
                      aria-label={`${r} star${r > 1 ? "s" : ""}`}
                      onClick={() => setForm({ ...form, rating: r })}
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          r <= form.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-title">Title (optional)</Label>
                <Input
                  id="review-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Sum up your experience"
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-comment">Review</Label>
                <Textarea
                  id="review-comment"
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  placeholder="What did you like or dislike?"
                  required
                  minLength={4}
                  maxLength={1000}
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit review
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="Share your thoughts to help other shoppers." />
      ) : (
        <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border p-4">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {review.user.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{review.user.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>
              {review.title && <p className="text-sm font-semibold">{review.title}</p>}
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
              <Separator className="mt-3 opacity-50" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
