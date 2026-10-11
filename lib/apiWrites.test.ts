import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createReview, deleteReview, logout, updateMyProfile, updateReview } from "./api";

function lastCall(mock: ReturnType<typeof vi.fn>) {
  return mock.mock.calls[mock.mock.calls.length - 1];
}

beforeEach(() => {
  document.cookie = "podcasdo_csrf=csrf-xyz";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("authenticated writes", () => {
  it("createReview sends CSRF header, credentials and JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "r1", podcast_id: "p1", rating: 8, body: "x", created_at: "t", updated_at: "t" }), {
        status: 201,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createReview("p1", { rating: 8, body: "x" });
    const [url, init] = lastCall(fetchMock);
    expect(url).toContain("/api/v1/podcasdo-podcasts/p1/reviews");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.headers["X-CSRF-Token"]).toBe("csrf-xyz");
    expect(JSON.parse(init.body)).toEqual({ rating: 8, body: "x" });
  });

  it("updateReview sends rating together with body:null for body-only deletion", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "r1", podcast_id: "p1", rating: 9, body: null, created_at: "t", updated_at: "t" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateReview("p1", "r1", { rating: 9, body: null });
    const [url, init] = lastCall(fetchMock);
    expect(url).toContain("/reviews/r1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ rating: 9, body: null });
  });

  it("deleteReview resolves on 204 with no body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(deleteReview("p1", "r1")).resolves.toBeUndefined();
    expect(lastCall(fetchMock)[1].method).toBe("DELETE");
  });

  it("updateMyProfile sends icon_config with allowed values", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user_id: "u", nickname: "n", icon_config: {}, updated_at: "t" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await updateMyProfile({ icon_config: { character: "fox", background: 3, decoration: "hat" } });
    expect(JSON.parse(lastCall(fetchMock)[1].body)).toEqual({
      icon_config: { character: "fox", background: 3, decoration: "hat" },
    });
  });

  it("parses Retry-After on 429", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "rate_limited", message: "limit", request_id: "r" } }), {
        status: 429,
        headers: { "Retry-After": "30" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(updateMyProfile({ nickname: "x" })).rejects.toMatchObject({ status: 429, retryAfter: 30 });
  });

  it("logout posts with credentials and CSRF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await logout();
    const [url, init] = lastCall(fetchMock);
    expect(url).toContain("/api/v1/auth/logout");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.headers["X-CSRF-Token"]).toBe("csrf-xyz");
  });
});
