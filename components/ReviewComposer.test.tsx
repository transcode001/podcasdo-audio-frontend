import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  ApiError,
  createReview,
  deleteReview,
  findMyReviewForPodcast,
  updateReview,
} from "../lib/api";
import type { Review } from "../lib/types";
import { ReviewComposer } from "./ReviewComposer";

const sess = vi.hoisted(() => ({
  value: { status: "authenticated", profile: null, refresh: vi.fn(), setProfile: vi.fn() } as {
    status: string;
    profile: unknown;
    refresh: () => void;
    setProfile: () => void;
  },
}));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("./SessionProvider", () => ({
  useSession: () => sess.value,
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return {
    ...actual,
    findMyReviewForPodcast: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
  };
});

const findMock = vi.mocked(findMyReviewForPodcast);
const createMock = vi.mocked(createReview);
const updateMock = vi.mocked(updateReview);
const deleteMock = vi.mocked(deleteReview);

function existingReview(overrides: Partial<Review> = {}): Review {
  return { id: "r1", podcast_id: "p1", rating: 8, body: "古い本文", created_at: "t", updated_at: "t", ...overrides };
}

beforeEach(() => {
  sess.value = { status: "authenticated", profile: null, refresh: vi.fn(), setProfile: vi.fn() };
  router.refresh.mockReset();
  findMock.mockReset();
  createMock.mockReset();
  updateMock.mockReset();
  deleteMock.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("ReviewComposer — auth gating", () => {
  it("shows a login prompt when anonymous", () => {
    sess.value = { status: "anonymous", profile: null, refresh: vi.fn(), setProfile: vi.fn() };
    render(<ReviewComposer podcastId="p1" />);
    expect(screen.getByText(/ログインが必要です/)).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });
});

describe("ReviewComposer — create", () => {
  it("rejects a body-only submission (no star)", async () => {
    findMock.mockResolvedValue(null);
    render(<ReviewComposer podcastId="p1" />);
    await screen.findByRole("heading", { name: "レビューを書く" });
    fireEvent.change(screen.getByLabelText("本文（任意）"), { target: { value: "感想だけ" } });
    fireEvent.click(screen.getByRole("button", { name: "投稿する" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("星評価を選んでください");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a review converting stars to 1..10 and refreshes", async () => {
    findMock.mockResolvedValueOnce(null); // initial: no existing review
    createMock.mockResolvedValue(existingReview());
    findMock.mockResolvedValueOnce(existingReview()); // reload after create
    render(<ReviewComposer podcastId="p1" />);
    await screen.findByRole("heading", { name: "レビューを書く" });
    fireEvent.change(screen.getByLabelText("星評価（必須）"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("本文（任意）"), { target: { value: "良い番組" } });
    fireEvent.click(screen.getByRole("button", { name: "投稿する" }));
    await waitFor(() => expect(createMock).toHaveBeenCalledWith("p1", { rating: 8, body: "良い番組" }));
    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
  });

  it("converts a 409 on create into edit mode", async () => {
    findMock.mockResolvedValueOnce(null); // initial: appears to have no review
    createMock.mockRejectedValue(new ApiError(409, "conflict", "既に投稿済み"));
    findMock.mockResolvedValueOnce(existingReview()); // reload locates the existing one
    render(<ReviewComposer podcastId="p1" />);
    await screen.findByRole("heading", { name: "レビューを書く" });
    fireEvent.change(screen.getByLabelText("星評価（必須）"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "投稿する" }));

    expect(await screen.findByRole("heading", { name: "レビューを編集" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("編集に切り替えました");
  });

  it("prevents double submission (button disabled while pending)", async () => {
    findMock.mockResolvedValue(null);
    let resolve!: (r: Review) => void;
    createMock.mockReturnValue(new Promise<Review>((r) => { resolve = r; }));
    render(<ReviewComposer podcastId="p1" />);
    await screen.findByRole("heading", { name: "レビューを書く" });
    fireEvent.change(screen.getByLabelText("星評価（必須）"), { target: { value: "3" } });
    const button = screen.getByRole("button", { name: "投稿する" });
    fireEvent.click(button);
    const pending = await screen.findByRole("button", { name: "送信中…" });
    expect(pending).toBeDisabled();
    expect(createMock).toHaveBeenCalledTimes(1);
    resolve(existingReview());
  });
});

describe("ReviewComposer — edit & delete", () => {
  it("prefills from the existing review and clears the body with rating kept", async () => {
    findMock.mockResolvedValue(existingReview({ rating: 8, body: "古い本文" }));
    updateMock.mockResolvedValue(existingReview({ body: null }));
    render(<ReviewComposer podcastId="p1" />);
    expect(await screen.findByRole("heading", { name: "レビューを編集" })).toBeInTheDocument();
    expect(screen.getByLabelText("本文（任意）")).toHaveValue("古い本文");

    fireEvent.click(screen.getByRole("button", { name: "本文だけ削除" }));
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith("p1", "r1", { rating: 8, body: null }));
  });

  it("fully deletes after confirmation", async () => {
    findMock.mockResolvedValue(existingReview());
    deleteMock.mockResolvedValue(undefined);
    render(<ReviewComposer podcastId="p1" />);
    await screen.findByRole("heading", { name: "レビューを編集" });

    fireEvent.click(screen.getByRole("button", { name: "投稿全体を削除" }));
    // Confirmation dialog appears; nothing deleted yet.
    expect(deleteMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("p1", "r1"));
    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
  });
});
