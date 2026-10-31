import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ApiError } from "../lib/api";
import { searchPodcasts } from "../lib/api";
import { SearchView } from "./SearchView";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  params: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => "/",
  useSearchParams: () => nav.params.current,
}));

vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return { ...actual, searchPodcasts: vi.fn() };
});

const searchMock = vi.mocked(searchPodcasts);

beforeEach(() => {
  nav.push.mockReset();
  nav.params.current = new URLSearchParams();
  searchMock.mockReset();
});

afterEach(() => vi.clearAllMocks());

describe("SearchView — explicit search & input bounds", () => {
  it("shows the idle prompt and does not search on mount without a query", () => {
    render(<SearchView />);
    expect(screen.getByText(/検索語を入力して/)).toBeInTheDocument();
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("rejects an empty query on submit and does not navigate", () => {
    render(<SearchView />);
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByRole("alert")).toHaveTextContent("検索語を入力してください");
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("rejects an over-long query (>100 chars)", () => {
    render(<SearchView />);
    const input = screen.getByLabelText("検索語");
    fireEvent.change(input, { target: { value: "あ".repeat(101) } });
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByRole("alert")).toHaveTextContent("100文字以内");
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("navigates with the trimmed query on a valid explicit submit", () => {
    render(<SearchView />);
    fireEvent.change(screen.getByLabelText("検索語"), { target: { value: "  ラジオ  " } });
    fireEvent.submit(screen.getByRole("search"));
    expect(nav.push).toHaveBeenCalledWith("/?q=%E3%83%A9%E3%82%B8%E3%82%AA");
  });
});

describe("SearchView — result states", () => {
  it("renders results for a query in the URL", async () => {
    nav.params.current = new URLSearchParams({ q: "ラジオ" });
    searchMock.mockResolvedValue({
      items: [{ id: "p1", title: "音声の入り口", publisher: "Podcas堂", source_url: null }],
      next_cursor: null,
    });
    render(<SearchView />);
    expect(await screen.findByText("音声の入り口")).toBeInTheDocument();
    expect(screen.queryByText("次へ")).not.toBeInTheDocument();
  });

  it("shows a 次へ button when next_cursor is present", async () => {
    nav.params.current = new URLSearchParams({ q: "ラジオ" });
    searchMock.mockResolvedValue({
      items: [{ id: "p1", title: "音声の入り口", publisher: null, source_url: null }],
      next_cursor: "cursor-2",
    });
    render(<SearchView />);
    const next = await screen.findByRole("button", { name: "次へ" });
    fireEvent.click(next);
    expect(nav.push).toHaveBeenCalledWith("/?q=%E3%83%A9%E3%82%B8%E3%82%AA&cursor=cursor-2");
  });

  it("shows the empty state for zero results", async () => {
    nav.params.current = new URLSearchParams({ q: "none" });
    searchMock.mockResolvedValue({ items: [], next_cursor: null });
    render(<SearchView />);
    expect(await screen.findByText("一致する番組が見つかりませんでした。")).toBeInTheDocument();
  });

  it("shows an error with retry, then recovers", async () => {
    nav.params.current = new URLSearchParams({ q: "ラジオ" });
    searchMock
      .mockRejectedValueOnce(new ApiError(502, "provider_unavailable", "番組情報を取得できません"))
      .mockResolvedValueOnce({
        items: [{ id: "p1", title: "復活番組", publisher: null, source_url: null }],
        next_cursor: null,
      });
    render(<SearchView />);
    expect(await screen.findByText("番組情報を取得できません")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(await screen.findByText("復活番組")).toBeInTheDocument();
  });
});
