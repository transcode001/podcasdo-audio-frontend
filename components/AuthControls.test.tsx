import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { logout } from "../lib/api";
import { AuthControls } from "./AuthControls";

const sess = vi.hoisted(() => ({
  value: { status: "anonymous", profile: null as unknown, refresh: vi.fn() },
}));
vi.mock("./SessionProvider", () => ({
  useSession: () => ({ ...sess.value, setProfile: vi.fn() }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return { ...actual, logout: vi.fn() };
});
const logoutMock = vi.mocked(logout);

beforeEach(() => {
  sess.value = { status: "anonymous", profile: null, refresh: vi.fn() };
  logoutMock.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("AuthControls", () => {
  it("shows a Google login link when anonymous", () => {
    render(<AuthControls />);
    const link = screen.getByRole("link", { name: "Googleでログイン" });
    expect(link).toHaveAttribute("href", expect.stringContaining("/api/v1/auth/google/start"));
  });

  it("shows nickname and logout when authenticated, and logs out", async () => {
    const refresh = vi.fn();
    sess.value = { status: "authenticated", profile: { nickname: "のんびりねこ" }, refresh };
    logoutMock.mockResolvedValue(undefined);
    render(<AuthControls />);
    expect(screen.getByText("のんびりねこ")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ログアウト" }));
    await waitFor(() => expect(logoutMock).toHaveBeenCalled());
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
