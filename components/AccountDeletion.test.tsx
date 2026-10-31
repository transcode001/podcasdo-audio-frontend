import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError, deleteAccount } from "../lib/api";
import { AccountDeletion } from "./AccountDeletion";

const sess = vi.hoisted(() => ({ refresh: vi.fn() }));
const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("./SessionProvider", () => ({
  useSession: () => ({ status: "authenticated", profile: null, refresh: sess.refresh, setProfile: vi.fn() }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return { ...actual, deleteAccount: vi.fn() };
});

const deleteMock = vi.mocked(deleteAccount);

beforeEach(() => {
  sess.refresh.mockReset();
  router.push.mockReset();
  deleteMock.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("AccountDeletion", () => {
  it("shows the re-auth link and requires confirmation before deleting", () => {
    render(<AccountDeletion />);
    expect(screen.getByRole("link", { name: /Googleで再認証/ })).toHaveAttribute(
      "href",
      expect.stringContaining("/api/v1/auth/google/start?purpose=delete"),
    );
    // No confirmation dialog yet; nothing deleted.
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes after confirmation, drops the session and returns home", async () => {
    deleteMock.mockResolvedValue(undefined);
    render(<AccountDeletion />);
    fireEvent.click(screen.getByRole("button", { name: "退会を確定する" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "退会する" }));
    await waitFor(() => expect(deleteMock).toHaveBeenCalled());
    await waitFor(() => expect(sess.refresh).toHaveBeenCalled());
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
  });

  it("prompts re-auth when the backend reports reauth_required", async () => {
    deleteMock.mockRejectedValue(new ApiError(400, "reauth_required", "削除には再認証が必要です"));
    render(<AccountDeletion />);
    fireEvent.click(screen.getByRole("button", { name: "退会を確定する" }));
    fireEvent.click(screen.getByRole("button", { name: "退会する" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("再認証が必要です");
    // A retry re-auth link is offered and the account was not removed.
    expect(screen.getByRole("link", { name: "再認証をやり直す" })).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("can cancel the confirmation", () => {
    render(<AccountDeletion />);
    fireEvent.click(screen.getByRole("button", { name: "退会を確定する" }));
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
