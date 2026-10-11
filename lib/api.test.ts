import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getPodcast, listReviews, searchPodcasts } from "./api";

function mockFetchOnce(body: string, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("searchPodcasts", () => {
  it("returns parsed results on success", async () => {
    const fetchMock = mockFetchOnce(
      JSON.stringify({
        items: [{ id: "p1", title: "音声の入り口", publisher: "pub", source_url: null }],
        next_cursor: "c2",
      }),
    );
    const res = await searchPodcasts("ラジオ");
    expect(res.items).toHaveLength(1);
    expect(res.items[0].title).toBe("音声の入り口");
    expect(res.next_cursor).toBe("c2");
    // Query is sent with q and limit.
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/podcasdo-podcasts/search?");
    expect(url).toContain("q=%E3%83%A9%E3%82%B8%E3%82%AA");
    expect(url).toContain("limit=20");
  });

  it("handles a zero-result response", async () => {
    mockFetchOnce(JSON.stringify({ items: [], next_cursor: null }));
    const res = await searchPodcasts("notfound");
    expect(res.items).toHaveLength(0);
    expect(res.next_cursor).toBeNull();
  });

  it("passes the cursor when provided", async () => {
    const fetchMock = mockFetchOnce(JSON.stringify({ items: [], next_cursor: null }));
    await searchPodcasts("x", "CURSOR123");
    expect(fetchMock.mock.calls[0][0]).toContain("cursor=CURSOR123");
  });

  it("maps the error envelope to ApiError", async () => {
    mockFetchOnce(
      JSON.stringify({ error: { code: "invalid_request", message: "検索語を確認してください", request_id: "req-1" } }),
      400,
    );
    await expect(searchPodcasts("x")).rejects.toMatchObject({
      status: 400,
      code: "invalid_request",
      requestId: "req-1",
    });
  });

  it("maps a provider 502 to ApiError", async () => {
    mockFetchOnce(
      JSON.stringify({ error: { code: "provider_unavailable", message: "番組情報を取得できません", request_id: "r" } }),
      502,
    );
    await expect(searchPodcasts("x")).rejects.toMatchObject({ status: 502, code: "provider_unavailable" });
  });

  it("raises invalid_response on malformed JSON", async () => {
    mockFetchOnce("<html>not json</html>", 200);
    await expect(searchPodcasts("x")).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("raises network_error when fetch rejects (backend down)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(searchPodcasts("x")).rejects.toMatchObject({ status: 0, code: "network_error" });
  });
});

describe("getPodcast", () => {
  it("returns detail on success", async () => {
    mockFetchOnce(
      JSON.stringify({
        id: "p1",
        title: "音声の入り口",
        publisher: null,
        source_url: null,
        rating_count: 2,
        average_rating: 4.5,
        links: [{ provider: "apple", url: "https://example.test" }],
      }),
    );
    const detail = await getPodcast("p1");
    expect(detail.rating_count).toBe(2);
    expect(detail.average_rating).toBe(4.5);
    expect(detail.links[0].provider).toBe("apple");
  });

  it("flags a 404 as not found", async () => {
    mockFetchOnce(
      JSON.stringify({ error: { code: "not_found", message: "番組が見つかりません", request_id: "r" } }),
      404,
    );
    try {
      await getPodcast("missing");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).isNotFound).toBe(true);
    }
  });
});

describe("listReviews", () => {
  it("returns a page of reviews with a cursor", async () => {
    mockFetchOnce(
      JSON.stringify({
        items: [
          { id: "r1", podcast_id: "p1", rating: 8, body: "良い", created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" },
        ],
        next_cursor: "next1",
      }),
    );
    const res = await listReviews("p1");
    expect(res.items[0].rating).toBe(8);
    expect(res.next_cursor).toBe("next1");
  });
});
