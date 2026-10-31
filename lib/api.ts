import { API_BASE_URL, PAGE_LIMIT } from "./config";
import { CSRF_HEADER, getCsrfToken } from "./csrf";
import type {
  ApiErrorBody,
  PodcastDetail,
  PodcastSearchResponse,
  Profile,
  ProfileInput,
  Review,
  ReviewInput,
  ReviewListResponse,
} from "./types";

/**
 * ApiError is the single error type surfaced by the fetch layer. `status` is 0
 * for transport failures (Backend unreachable) and for malformed responses.
 * `retryAfter` carries the Retry-After seconds on a 429, when present.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly retryAfter?: number;

  constructor(status: number, code: string, message: string, requestId?: string, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.retryAfter = retryAfter;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) return false;
  const err = (value as { error?: unknown }).error;
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as { code?: unknown }).code === "string" &&
    typeof (err as { message?: unknown }).message === "string"
  );
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Send cookies (needed for authenticated endpoints). */
  credentials?: boolean;
  /** Attach the double-submit CSRF header (state-changing authed requests). */
  csrf?: boolean;
  signal?: AbortSignal;
  cache?: RequestCache;
}

function parseRetryAfter(res: Response): number | undefined {
  const raw = res.headers.get("Retry-After");
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.csrf) {
    const token = getCsrfToken();
    if (token) headers[CSRF_HEADER] = token;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: opts.credentials ? "include" : "same-origin",
      signal: opts.signal,
      cache: opts.cache ?? "no-store",
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new ApiError(0, "aborted", "リクエストが中止されました");
    }
    throw new ApiError(0, "network_error", "サーバーに接続できませんでした");
  }

  const raw = await res.text();
  let parsed: unknown = undefined;
  if (raw.length > 0) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ApiError(res.ok ? 0 : res.status, "invalid_response", "サーバーの応答を解釈できませんでした");
    }
  }

  if (!res.ok) {
    const retryAfter = parseRetryAfter(res);
    if (isApiErrorBody(parsed)) {
      throw new ApiError(res.status, parsed.error.code, parsed.error.message, parsed.error.request_id, retryAfter);
    }
    throw new ApiError(res.status, "error", `リクエストに失敗しました (${res.status})`, undefined, retryAfter);
  }

  return parsed as T;
}

function listQuery(cursor?: string | null, limit: number = PAGE_LIMIT): string {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));
  return params.toString();
}

// ---- Public reads ----

export async function searchPodcasts(
  query: string,
  cursor?: string | null,
  opts: { signal?: AbortSignal } = {},
): Promise<PodcastSearchResponse> {
  const params = new URLSearchParams();
  params.set("q", query);
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(PAGE_LIMIT));
  return request<PodcastSearchResponse>(`/api/v1/podcasdo-podcasts/search?${params.toString()}`, opts);
}

export async function getPodcast(id: string, opts: { signal?: AbortSignal } = {}): Promise<PodcastDetail> {
  return request<PodcastDetail>(`/api/v1/podcasdo-podcasts/${encodeURIComponent(id)}`, opts);
}

export async function listReviews(
  podcastId: string,
  cursor?: string | null,
  opts: { signal?: AbortSignal } = {},
): Promise<ReviewListResponse> {
  return request<ReviewListResponse>(
    `/api/v1/podcasdo-podcasts/${encodeURIComponent(podcastId)}/reviews?${listQuery(cursor)}`,
    opts,
  );
}

// ---- Authenticated reads ----

export async function getMyProfile(): Promise<Profile> {
  return request<Profile>(`/api/v1/me/profile`, { credentials: true });
}

export async function listMyReviews(cursor?: string | null): Promise<ReviewListResponse> {
  return request<ReviewListResponse>(`/api/v1/me/reviews?${listQuery(cursor)}`, { credentials: true });
}

/**
 * Find the authenticated user's review for a podcast, if any. Reviews carry no
 * user_id in public responses, so ownership is resolved via the personal list
 * (which includes rating-only reviews). Pages are scanned up to a small cap.
 */
export async function findMyReviewForPodcast(podcastId: string): Promise<Review | null> {
  // Reviews carry no user_id in public responses, and /me/reviews has no
  // per-podcast filter, so scan the user's own reviews page by page. Terminate
  // only when the cursor is exhausted (next_cursor == null) so a user with many
  // reviews cannot miss their existing one (which would otherwise surface as a
  // 409 on create). A stuck/repeating cursor breaks the loop defensively.
  let cursor: string | null = null;
  const seen = new Set<string>();
  for (;;) {
    const res: ReviewListResponse = await listMyReviews(cursor);
    const match = res.items.find((r) => r.podcast_id === podcastId);
    if (match) return match;
    const next: string | null = res.next_cursor;
    if (!next || seen.has(next)) return null;
    seen.add(next);
    cursor = next;
  }
}

// ---- Authenticated writes (cookie + CSRF) ----

export async function createReview(podcastId: string, input: ReviewInput): Promise<Review> {
  return request<Review>(`/api/v1/podcasdo-podcasts/${encodeURIComponent(podcastId)}/reviews`, {
    method: "POST",
    body: input,
    credentials: true,
    csrf: true,
  });
}

export async function updateReview(podcastId: string, reviewId: string, input: ReviewInput): Promise<Review> {
  return request<Review>(
    `/api/v1/podcasdo-podcasts/${encodeURIComponent(podcastId)}/reviews/${encodeURIComponent(reviewId)}`,
    { method: "PATCH", body: input, credentials: true, csrf: true },
  );
}

export async function deleteReview(podcastId: string, reviewId: string): Promise<void> {
  await request<void>(
    `/api/v1/podcasdo-podcasts/${encodeURIComponent(podcastId)}/reviews/${encodeURIComponent(reviewId)}`,
    { method: "DELETE", credentials: true, csrf: true },
  );
}

export async function updateMyProfile(input: ProfileInput): Promise<Profile> {
  return request<Profile>(`/api/v1/me/profile`, { method: "PATCH", body: input, credentials: true, csrf: true });
}

export async function logout(): Promise<void> {
  await request<void>(`/api/v1/auth/logout`, { method: "POST", credentials: true, csrf: true });
}

// deleteAccount consumes a prior deletion grant (established by the Google
// re-authentication) and permanently removes the account. It throws ApiError
// with code "reauth_required" (status 400) when no valid grant exists.
export async function deleteAccount(): Promise<void> {
  await request<void>(`/api/v1/auth/delete`, { method: "POST", credentials: true, csrf: true });
}

// Full-page navigation URL to begin Google login (not a fetch; avoids CORS).
export function googleLoginUrl(): string {
  return `${API_BASE_URL}/api/v1/auth/google/start`;
}

// Full-page navigation URL to re-authenticate specifically for account deletion
// (backend issues a one-time, 5-minute deletion grant on success).
export function googleDeleteReauthUrl(): string {
  return `${API_BASE_URL}/api/v1/auth/google/start?purpose=delete`;
}
