"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createReview,
  deleteReview,
  findMyReviewForPodcast,
  googleLoginUrl,
  updateReview,
} from "../lib/api";
import { BODY_MAX, countChars, validateReview } from "../lib/reviewInput";
import { ratingToStars } from "../lib/rating";
import { toUserMessage, retryAfterMessage } from "../lib/errorMessage";
import { ApiError } from "../lib/api";
import type { Review } from "../lib/types";
import { useSession } from "./SessionProvider";
import { StarInput } from "./StarInput";

// ReviewComposer lets the signed-in user create, edit, clear the body of, or
// fully delete their own review for a podcast. After any change it refreshes the
// server-rendered detail (average, count, public list) via router.refresh().
export function ReviewComposer({ podcastId }: { podcastId: string }) {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<Review | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    findMyReviewForPodcast(podcastId)
      .then((mine) => {
        if (!active) return;
        setExisting(mine);
        if (mine) {
          setStars(ratingToStars(mine.rating));
          setBody(mine.body ?? "");
        }
      })
      .catch(() => {
        /* leave as create mode; submit will surface any real error */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [podcastId, status]);

  if (status === "loading") {
    return <p className="status">読み込み中…</p>;
  }
  if (status === "anonymous") {
    return (
      <section className="status" aria-labelledby="compose-heading">
        <h2 id="compose-heading">レビューを書く</h2>
        <p>
          レビューの投稿にはログインが必要です。{" "}
          <a href={googleLoginUrl()}>Googleでログイン</a>
        </p>
      </section>
    );
  }
  if (loading) {
    return <p className="status">レビュー情報を読み込み中…</p>;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return; // guard against double submit
    const result = validateReview(stars, body);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      if (existing) {
        await updateReview(podcastId, existing.id, result.value);
      } else {
        await createReview(podcastId, result.value);
      }
      await reload();
    } catch (err) {
      // Safety net: a 409 on create means a review already exists (e.g. created
      // on another device). Switch to edit mode instead of showing a raw
      // conflict, so the user can update it.
      if (!existing && err instanceof ApiError && err.status === 409) {
        await reload();
        setFormError("すでにこの番組へレビューを投稿済みです。編集に切り替えました。");
      } else {
        setFormError(messageFor(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function clearBody() {
    if (submitting || !existing) return;
    // Body-only deletion: keep the current rating, send body: null.
    setSubmitting(true);
    setFormError(null);
    try {
      await updateReview(podcastId, existing.id, { rating: existing.rating, body: null });
      await reload();
    } catch (err) {
      setFormError(messageFor(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeAll() {
    if (submitting || !existing) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await deleteReview(podcastId, existing.id);
      setExisting(null);
      setStars(null);
      setBody("");
      setConfirmDelete(false);
      router.refresh();
    } catch (err) {
      setFormError(messageFor(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function reload() {
    const mine = await findMyReviewForPodcast(podcastId);
    setExisting(mine);
    if (mine) {
      setStars(ratingToStars(mine.rating));
      setBody(mine.body ?? "");
    }
    router.refresh();
  }

  const charCount = countChars(body);
  const overLimit = charCount > BODY_MAX;

  return (
    <section aria-labelledby="compose-heading">
      <h2 id="compose-heading">{existing ? "レビューを編集" : "レビューを書く"}</h2>
      <form onSubmit={submit}>
        <StarInput value={stars} onChange={setStars} />

        <div className="field">
          <label htmlFor="review-body">本文（任意）</label>
          <textarea
            id="review-body"
            value={body}
            rows={4}
            onChange={(e) => setBody(e.target.value)}
            aria-describedby="body-count"
          />
          <p id="body-count" className={overLimit ? "field-error" : "field-hint"}>
            {charCount} / {BODY_MAX} 文字
          </p>
        </div>

        {formError ? (
          <p className="field-error" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="pager">
          <button type="submit" disabled={submitting}>
            {submitting ? "送信中…" : existing ? "更新する" : "投稿する"}
          </button>
          {existing && existing.body ? (
            <button type="button" className="secondary" onClick={clearBody} disabled={submitting}>
              本文だけ削除
            </button>
          ) : null}
          {existing ? (
            <button type="button" className="secondary" onClick={() => setConfirmDelete(true)} disabled={submitting}>
              投稿全体を削除
            </button>
          ) : null}
        </div>
      </form>

      {confirmDelete ? (
        <div className="status" role="alertdialog" aria-label="投稿全体の削除確認">
          <p>投稿全体を削除すると星評価と本文の両方が削除され、元に戻せません。削除しますか？</p>
          <div className="pager">
            <button type="button" onClick={removeAll} disabled={submitting}>
              削除する
            </button>
            <button type="button" className="secondary" onClick={() => setConfirmDelete(false)} disabled={submitting}>
              キャンセル
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function messageFor(err: unknown): string {
  if (err instanceof ApiError && err.status === 429) {
    const hint = retryAfterMessage(err.retryAfter ?? null);
    return `${toUserMessage(err)}${hint ? " " + hint : ""}`;
  }
  return toUserMessage(err);
}
