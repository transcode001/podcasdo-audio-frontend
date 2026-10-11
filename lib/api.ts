import { API_BASE_URL, PAGE_LIMIT } from "./config";
import type {
  ApiErrorBody,
  PodcastDetail,
  PodcastSearchResponse,
  ReviewListResponse,
} from "./types";

/**
 * ApiError is the single error type surfaced by the fetch layer. `status` is 0
 * for transport failures (Backend unreachable) and for malformed responses.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
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
  signal?: AbortSignal;
  /** Next.js fetch cache hint; "no-store" for always-fresh public reads. */
  cache?: RequestCache;
}

async function getJSON<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: opts.signal,
      cache: opts.cache ?? "no-store",
    });
  } catch (cause) {
    // Network/transport failure: Backend down, DNS, CORS, abort, etc.
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
      throw new ApiError(
        res.ok ? 0 : res.status,
        "invalid_response",
        "サーバーの応答を解釈できませんでした",
      );
    }
  }

  if (!res.ok) {
    if (isApiErrorBody(parsed)) {
      throw new ApiError(res.status, parsed.error.code, parsed.error.message, parsed.error.request_id);
    }
    throw new ApiError(res.status, "error", `リクエストに失敗しました (${res.status})`);
  }

  return parsed as T;
}

function buildListQuery(cursor?: string | null, limit: number = PAGE_LIMIT): string {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));
  return params.toString();
}

export async function searchPodcasts(
  query: string,
  cursor?: string | null,
  opts: RequestOptions = {},
): Promise<PodcastSearchResponse> {
  const params = new URLSearchParams();
  params.set("q", query);
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(PAGE_LIMIT));
  return getJSON<PodcastSearchResponse>(`/api/v1/podcasdo-podcasts/search?${params.toString()}`, opts);
}

export async function getPodcast(id: string, opts: RequestOptions = {}): Promise<PodcastDetail> {
  return getJSON<PodcastDetail>(`/api/v1/podcasdo-podcasts/${encodeURIComponent(id)}`, opts);
}

export async function listReviews(
  podcastId: string,
  cursor?: string | null,
  opts: RequestOptions = {},
): Promise<ReviewListResponse> {
  const qs = buildListQuery(cursor);
  return getJSON<ReviewListResponse>(
    `/api/v1/podcasdo-podcasts/${encodeURIComponent(podcastId)}/reviews?${qs}`,
    opts,
  );
}
