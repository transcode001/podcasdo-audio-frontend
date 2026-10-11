"use client";

import { useState } from "react";
import { ApiError, listReviews } from "../lib/api";
import { ratingToStars } from "../lib/rating";
import type { Review } from "../lib/types";
import { StarRating } from "./StarRating";

interface ReviewListProps {
  podcastId: string;
  initialItems: Review[];
  initialCursor: string | null;
  initialError?: boolean;
}

// ReviewList shows the public (body-bearing) reviews newest-first and loads more
// pages via the cursor. The first page is provided by the server; "次へ" appends
// subsequent pages on the client.
export function ReviewList({ podcastId, initialItems, initialCursor, initialError = false }: ReviewListProps) {
  const [items, setItems] = useState<Review[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ? "レビューを取得できませんでした" : null);

  async function loadMore() {
    setLoading(true);
    setError(null);
    try {
      const res = await listReviews(podcastId, cursor);
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.next_cursor);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "レビューを取得できませんでした");
    } finally {
      setLoading(false);
    }
  }

  async function retryInitial() {
    setLoading(true);
    setError(null);
    try {
      const res = await listReviews(podcastId, null);
      setItems(res.items);
      setCursor(res.next_cursor);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "レビューを取得できませんでした");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading">レビュー</h2>

      {error && items.length === 0 ? (
        <div className="status error" role="alert">
          <p>{error}</p>
          <button type="button" className="secondary" onClick={retryInitial} disabled={loading}>
            再試行
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="status">まだレビューはありません。</p>
      ) : (
        <ul className="review-list">
          {items.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </ul>
      )}

      {error && items.length > 0 ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}

      {cursor ? (
        <div className="pager">
          <button type="button" onClick={loadMore} disabled={loading}>
            {loading ? "読み込み中…" : "次へ"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const edited = review.updated_at !== review.created_at;
  return (
    <li className="review-item">
      <StarRating stars={ratingToStars(review.rating)} />
      {review.body ? <p>{review.body}</p> : null}
      <p className="review-meta">
        投稿日 {formatDate(review.created_at)}
        {edited ? " ・ 編集済み" : ""}
      </p>
    </li>
  );
}

// formatDate renders the date portion of an ISO-8601 timestamp (UTC) without
// locale/timezone nondeterminism.
function formatDate(iso: string): string {
  return iso.slice(0, 10);
}
