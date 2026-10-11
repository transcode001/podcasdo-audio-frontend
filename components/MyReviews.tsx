"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteReview, listMyReviews } from "../lib/api";
import { ratingToStars } from "../lib/rating";
import { toUserMessage } from "../lib/errorMessage";
import type { Review } from "../lib/types";
import { StarRating } from "./StarRating";

// MyReviews lists the signed-in user's own reviews, most-recently-updated first
// (includes rating-only reviews), with cursor paging and full deletion.
export function MyReviews() {
  const [items, setItems] = useState<Review[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listMyReviews(null)
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setCursor(res.next_cursor);
      })
      .catch((err) => active && setError(toUserMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function loadMore() {
    setError(null);
    try {
      const res = await listMyReviews(cursor);
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.next_cursor);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  async function remove(review: Review) {
    setError(null);
    try {
      await deleteReview(review.podcast_id, review.id);
      setItems((prev) => prev.filter((r) => r.id !== review.id));
      setConfirmId(null);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  if (loading) return <p className="status">読み込み中…</p>;

  return (
    <section aria-labelledby="my-reviews-heading">
      <h2 id="my-reviews-heading">自分のレビュー</h2>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className="status">まだレビューを投稿していません。</p>
      ) : (
        <ul className="review-list">
          {items.map((review) => (
            <li key={review.id} className="review-item">
              <StarRating stars={ratingToStars(review.rating)} />
              <p>{review.body ? review.body : <span className="field-hint">（本文なし）</span>}</p>
              <p className="review-meta">更新日 {review.updated_at.slice(0, 10)}</p>
              <div className="pager">
                <Link href={`/podcasdo-podcasts/${encodeURIComponent(review.podcast_id)}`}>番組を開いて編集</Link>
                {confirmId === review.id ? (
                  <>
                    <button type="button" onClick={() => remove(review)}>
                      削除する
                    </button>
                    <button type="button" className="secondary" onClick={() => setConfirmId(null)}>
                      キャンセル
                    </button>
                  </>
                ) : (
                  <button type="button" className="secondary" onClick={() => setConfirmId(review.id)}>
                    投稿全体を削除
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {cursor ? (
        <div className="pager">
          <button type="button" onClick={loadMore}>
            次へ
          </button>
        </div>
      ) : null}
    </section>
  );
}
