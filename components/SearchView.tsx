"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, searchPodcasts } from "../lib/api";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "../lib/config";
import type { PodcastSearchResponse } from "../lib/types";
import { PodcastCard } from "./PodcastCard";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: PodcastSearchResponse }
  | { kind: "error"; message: string };

function validate(query: string): string | null {
  const trimmed = query.trim();
  if (trimmed.length < SEARCH_MIN_LENGTH) return "検索語を入力してください";
  if (trimmed.length > SEARCH_MAX_LENGTH) return `検索語は${SEARCH_MAX_LENGTH}文字以内で入力してください`;
  return null;
}

export function SearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const cursor = searchParams.get("cursor");

  const [input, setInput] = useState(query);
  const [inputError, setInputError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Bumped to force a retry of the same URL params.
  const [retryToken, setRetryToken] = useState(0);

  // Keep the input in sync when navigation (back/forward) changes the URL query.
  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < SEARCH_MIN_LENGTH || trimmed.length > SEARCH_MAX_LENGTH) {
      setStatus({ kind: "idle" });
      return;
    }
    const controller = new AbortController();
    setStatus({ kind: "loading" });
    searchPodcasts(trimmed, cursor, { signal: controller.signal })
      .then((data) => setStatus({ kind: "success", data }))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.code === "aborted") return;
        const message =
          err instanceof ApiError ? err.message : "検索中に問題が発生しました";
        setStatus({ kind: "error", message });
      });
    return () => controller.abort();
  }, [query, cursor, retryToken]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const error = validate(input);
    setInputError(error);
    if (error) return;
    // New search always starts at the first page (no cursor).
    const params = new URLSearchParams({ q: input.trim() });
    router.push(`${pathname}?${params.toString()}`);
  }

  function goNext(nextCursor: string) {
    const params = new URLSearchParams({ q: query.trim(), cursor: nextCursor });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <section aria-labelledby="search-heading">
      <h1 id="search-heading">Podcastを検索</h1>
      <form className="search-form" role="search" onSubmit={submit}>
        <label htmlFor="q" className="visually-hidden">
          検索語
        </label>
        <input
          id="q"
          name="q"
          type="search"
          value={input}
          maxLength={SEARCH_MAX_LENGTH}
          onChange={(e) => setInput(e.target.value)}
          aria-describedby="q-hint"
          aria-invalid={inputError ? true : undefined}
          autoComplete="off"
        />
        <button type="submit">検索</button>
      </form>
      <p id="q-hint" className="field-hint">
        番組タイトルで検索します（1〜{SEARCH_MAX_LENGTH}文字）。
      </p>
      {inputError ? (
        <p className="field-error" role="alert">
          {inputError}
        </p>
      ) : null}

      <div aria-live="polite">
        <SearchResults status={status} onNext={goNext} onRetry={() => setRetryToken((n) => n + 1)} />
      </div>
    </section>
  );
}

function SearchResults({
  status,
  onNext,
  onRetry,
}: {
  status: Status;
  onNext: (cursor: string) => void;
  onRetry: () => void;
}) {
  if (status.kind === "idle") {
    return <p className="status">検索語を入力して「検索」を押してください。</p>;
  }
  if (status.kind === "loading") {
    return <p className="status">検索しています…</p>;
  }
  if (status.kind === "error") {
    return (
      <div className="status error" role="alert">
        <p>{status.message}</p>
        <button type="button" className="secondary" onClick={onRetry}>
          再試行
        </button>
      </div>
    );
  }
  const { items, next_cursor } = status.data;
  if (items.length === 0) {
    return <p className="status">一致する番組が見つかりませんでした。</p>;
  }
  return (
    <>
      <ul className="result-list">
        {items.map((podcast) => (
          <PodcastCard key={podcast.id} podcast={podcast} />
        ))}
      </ul>
      {next_cursor ? (
        <div className="pager">
          <button type="button" onClick={() => onNext(next_cursor)}>
            次へ
          </button>
        </div>
      ) : null}
    </>
  );
}
