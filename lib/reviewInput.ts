import { starsToRating } from "./rating";

// Client-side review validation, mirroring the Backend rules (reviews.md R1).
// The Backend is authoritative; this pre-validation keeps the UI honest and
// gives immediate feedback.

export const BODY_MAX = 2000;

// Leading/trailing whitespace stripped before length checks: half-width and
// full-width space, tab, newline.
const TRIM = /^[ 　\t\n]+|[ 　\t\n]+$/g;

/**
 * Normalize a body string: unify newlines to LF, trim surrounding whitespace,
 * and return null when the result is empty (blank-only is "no body").
 */
export function normalizeBody(raw: string): string | null {
  const lf = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const trimmed = lf.replace(TRIM, "");
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Count user-visible characters. The accepted spec uses extended grapheme
 * clusters; the exact Unicode library is undecided, so this uses the runtime's
 * Intl.Segmenter when available and falls back to code points. Reported as an
 * interim measure, matching the Backend's interim counting.
 */
export function countChars(text: string): number {
  const Segmenter = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Segmenter) {
    const seg = new Segmenter("ja", { granularity: "grapheme" });
    let n = 0;
    for (const _ of seg.segment(text)) n++;
    return n;
  }
  return [...text].length;
}

export interface ValidReview {
  rating: number; // internal 1..10
  body: string | null;
}

export type ReviewValidation =
  | { ok: true; value: ValidReview }
  | { ok: false; message: string };

/**
 * Validate a star selection plus optional body text into the API payload.
 * A rating is required; a body-only post is rejected; the body is capped at
 * BODY_MAX after normalization.
 */
export function validateReview(stars: number | null, bodyText: string): ReviewValidation {
  if (stars === null) {
    return { ok: false, message: "星評価を選んでください" };
  }
  const rating = starsToRating(stars);
  if (rating === null) {
    return { ok: false, message: "星評価は0.5〜5.0の範囲で選んでください" };
  }
  const body = normalizeBody(bodyText);
  if (body !== null && countChars(body) > BODY_MAX) {
    return { ok: false, message: `本文は${BODY_MAX}文字以内で入力してください` };
  }
  return { ok: true, value: { rating, body } };
}
