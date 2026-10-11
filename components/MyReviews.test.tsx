import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { deleteReview, listMyReviews } from "../lib/api";
import type { Review } from "../lib/types";
import { MyReviews } from "./MyReviews";

vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return { ...actual, listMyReviews: vi.fn(), deleteReview: vi.fn() };
});
const listMock = vi.mocked(listMyReviews);
const deleteMock = vi.mocked(deleteReview);

function rev(id: string, body: string | null, podcast = "p1"): Review {
  return { id, podcast_id: podcast, rating: 8, body, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-02T00:00:00Z" };
}

beforeEach(() => {
  listMock.mockReset();
  deleteMock.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("MyReviews", () => {
  it("shows own reviews including rating-only, and pages with the cursor", async () => {
    listMock.mockResolvedValueOnce({ items: [rev("r1", "本文あり"), rev("r2", null)], next_cursor: "c2" });
    render(<MyReviews />);
    expect(await screen.findByText("本文あり")).toBeInTheDocument();
    expect(screen.getByText("（本文なし）")).toBeInTheDocument();

    listMock.mockResolvedValueOnce({ items: [rev("r3", "次ページ")], next_cursor: null });
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(await screen.findByText("次ページ")).toBeInTheDocument();
    expect(listMock).toHaveBeenLastCalledWith("c2");
  });

  it("deletes a review after confirmation", async () => {
    listMock.mockResolvedValueOnce({ items: [rev("r1", "消す")], next_cursor: null });
    deleteMock.mockResolvedValue(undefined);
    render(<MyReviews />);
    await screen.findByText("消す");
    fireEvent.click(screen.getByRole("button", { name: "投稿全体を削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("p1", "r1"));
    await waitFor(() => expect(screen.queryByText("消す")).not.toBeInTheDocument());
  });
});
