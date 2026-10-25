import { afterEach, describe, expect, it, vi } from "vitest";
import { findMyReviewForPodcast } from "./api";
import type { Review } from "./types";

function rev(id: string, podcast: string): Review {
  return { id, podcast_id: podcast, rating: 8, body: null, created_at: "t", updated_at: "t" };
}

function page(items: Review[], next: string | null): Response {
  return new Response(JSON.stringify({ items, next_cursor: next }), { status: 200 });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("findMyReviewForPodcast", () => {
  it("scans across many pages (beyond the old 400 cap) until found", async () => {
    // 25 pages with no match, then the match on page 26 — the old 20-page cap
    // would have missed it and caused a false create -> 409.
    const fetchMock = vi.fn();
    for (let i = 0; i < 25; i++) {
      fetchMock.mockResolvedValueOnce(page([rev(`r${i}`, "other")], `c${i}`));
    }
    fetchMock.mockResolvedValueOnce(page([rev("mine", "p-target")], null));
    vi.stubGlobal("fetch", fetchMock);

    const found = await findMyReviewForPodcast("p-target");
    expect(found?.id).toBe("mine");
    expect(fetchMock).toHaveBeenCalledTimes(26);
  });

  it("returns null when exhausted (next_cursor null)", async () => {
    // A fresh Response per call (a Response body can only be read once).
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(page([rev("r1", "other")], null)));
    vi.stubGlobal("fetch", fetchMock);
    expect(await findMyReviewForPodcast("p-target")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("breaks on a stuck/repeating cursor instead of looping forever", async () => {
    // A misbehaving backend returns the same cursor forever.
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(page([rev("r1", "other")], "same")));
    vi.stubGlobal("fetch", fetchMock);
    expect(await findMyReviewForPodcast("p-target")).toBeNull();
    // First call sees "same" (new), second call sees "same" again (seen) -> stop.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
