import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ApiError } from "../lib/api";
import { listReviews } from "../lib/api";
import type { Review } from "../lib/types";
import { ReviewList } from "./ReviewList";

vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return { ...actual, listReviews: vi.fn() };
});

const listMock = vi.mocked(listReviews);

function review(id: string, body: string | null, created = "2026-10-01T00:00:00Z", updated = "2026-10-01T00:00:00Z"): Review {
  return { id, podcast_id: "p1", rating: 8, body, created_at: created, updated_at: updated };
}

beforeEach(() => listMock.mockReset());
afterEach(() => vi.clearAllMocks());

describe("ReviewList", () => {
  it("renders the empty state", () => {
    render(<ReviewList podcastId="p1" initialItems={[]} initialCursor={null} />);
    expect(screen.getByText("まだレビューはありません。")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "次へ" })).not.toBeInTheDocument();
  });

  it("renders the first page and shows 編集済み when edited", () => {
    render(
      <ReviewList
        podcastId="p1"
        initialItems={[review("r1", "とても良い", "2026-10-01T00:00:00Z", "2026-10-02T00:00:00Z")]}
        initialCursor={null}
      />,
    );
    expect(screen.getByText("とても良い")).toBeInTheDocument();
    expect(screen.getByText(/編集済み/)).toBeInTheDocument();
  });

  it("appends the next page via the cursor", async () => {
    listMock.mockResolvedValue({ items: [review("r2", "二件目")], next_cursor: null });
    render(
      <ReviewList podcastId="p1" initialItems={[review("r1", "一件目")]} initialCursor="cursor-2" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(await screen.findByText("二件目")).toBeInTheDocument();
    expect(screen.getByText("一件目")).toBeInTheDocument();
    expect(listMock).toHaveBeenCalledWith("p1", "cursor-2");
    // Cursor exhausted -> no more button.
    expect(screen.queryByRole("button", { name: "次へ" })).not.toBeInTheDocument();
  });

  it("shows an error then retries the first page", async () => {
    listMock.mockResolvedValueOnce({ items: [review("r2", "再取得")], next_cursor: null });
    render(
      <ReviewList
        podcastId="p1"
        initialItems={[]}
        initialCursor={null}
        initialError
      />,
    );
    expect(screen.getByText("レビューを取得できませんでした")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(await screen.findByText("再取得")).toBeInTheDocument();
  });
});
