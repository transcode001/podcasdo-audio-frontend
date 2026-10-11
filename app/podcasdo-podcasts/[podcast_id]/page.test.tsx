import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApiError } from "../../../lib/api";
import { getPodcast, listReviews } from "../../../lib/api";
import type { PodcastDetail } from "../../../lib/types";
import PodcastDetailPage from "./page";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("../../../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../../../lib/api")>();
  return { ...actual, getPodcast: vi.fn(), listReviews: vi.fn() };
});

const getPodcastMock = vi.mocked(getPodcast);
const listReviewsMock = vi.mocked(listReviews);

const detail: PodcastDetail = {
  id: "p1",
  title: "音声の入り口",
  publisher: "Podcas堂",
  source_url: null,
  rating_count: 2,
  average_rating: 4.5,
  links: [{ provider: "apple", url: "https://example.test/apple" }],
};

function params(id: string) {
  return { params: Promise.resolve({ podcast_id: id }) };
}

beforeEach(() => {
  getPodcastMock.mockReset();
  listReviewsMock.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("PodcastDetailPage", () => {
  it("renders detail, rating summary and the first review page", async () => {
    getPodcastMock.mockResolvedValue(detail);
    listReviewsMock.mockResolvedValue({
      items: [
        { id: "r1", podcast_id: "p1", rating: 9, body: "とても良い番組", created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" },
      ],
      next_cursor: null,
    });

    render(await PodcastDetailPage(params("p1")));

    expect(screen.getByRole("heading", { name: "音声の入り口", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Podcas堂")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText(/2件/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "apple" })).toHaveAttribute("href", "https://example.test/apple");
    expect(screen.getByText("とても良い番組")).toBeInTheDocument();
  });

  it("calls notFound() on a 404", async () => {
    getPodcastMock.mockRejectedValue(new ApiError(404, "not_found", "番組が見つかりません"));
    await expect(PodcastDetailPage(params("missing"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders an inline error on a non-404 API failure", async () => {
    getPodcastMock.mockRejectedValue(new ApiError(502, "provider_unavailable", "番組情報を取得できません"));
    render(await PodcastDetailPage(params("p1")));
    expect(screen.getByRole("alert")).toHaveTextContent("番組情報を取得できませんでした");
  });

  it("still renders detail when the review fetch fails", async () => {
    getPodcastMock.mockResolvedValue(detail);
    listReviewsMock.mockRejectedValue(new ApiError(502, "provider_unavailable", "x"));
    render(await PodcastDetailPage(params("p1")));
    expect(screen.getByRole("heading", { name: "音声の入り口", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("レビューを取得できませんでした")).toBeInTheDocument();
  });
});
