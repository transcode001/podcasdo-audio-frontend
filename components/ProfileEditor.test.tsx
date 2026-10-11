import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError, updateMyProfile } from "../lib/api";
import type { Profile } from "../lib/types";
import { ProfileEditor } from "./ProfileEditor";

const sess = vi.hoisted(() => ({ setProfile: vi.fn() }));
vi.mock("./SessionProvider", () => ({
  useSession: () => ({ status: "authenticated", profile: null, refresh: vi.fn(), setProfile: sess.setProfile }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("../lib/api", async (importActual) => {
  const actual = await importActual<typeof import("../lib/api")>();
  return { ...actual, updateMyProfile: vi.fn() };
});

const updateMock = vi.mocked(updateMyProfile);

const profile: Profile = {
  user_id: "u1",
  nickname: "のんびりねこ",
  icon_config: { character: "cat", background: 1, decoration: "none", version: "v1" },
  updated_at: "t",
};

beforeEach(() => {
  sess.setProfile.mockReset();
  updateMock.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("ProfileEditor — nickname", () => {
  it("rejects an empty nickname without calling the API", () => {
    render(<ProfileEditor profile={profile} />);
    fireEvent.change(screen.getByLabelText(/ニックネーム/), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "ニックネームを保存" }));
    expect(screen.getByRole("alert")).toHaveTextContent("ニックネームを入力してください");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("saves a valid nickname and updates the session", async () => {
    updateMock.mockResolvedValue({ ...profile, nickname: "きまぐれくま" });
    render(<ProfileEditor profile={profile} />);
    fireEvent.change(screen.getByLabelText(/ニックネーム/), { target: { value: "きまぐれくま" } });
    fireEvent.click(screen.getByRole("button", { name: "ニックネームを保存" }));
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith({ nickname: "きまぐれくま" }));
    await waitFor(() => expect(sess.setProfile).toHaveBeenCalled());
  });

  it("shows the rename limit message on 429", async () => {
    updateMock.mockRejectedValue(new ApiError(429, "rate_limited", "x", undefined, 86400));
    render(<ProfileEditor profile={profile} />);
    fireEvent.change(screen.getByLabelText(/ニックネーム/), { target: { value: "あたらしい" } });
    fireEvent.click(screen.getByRole("button", { name: "ニックネームを保存" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("変更回数の上限");
  });
});

describe("ProfileEditor — icon", () => {
  it("saves icon_config with only allowed values", async () => {
    updateMock.mockResolvedValue(profile);
    render(<ProfileEditor profile={profile} />);
    fireEvent.change(screen.getByLabelText("キャラクター"), { target: { value: "panda" } });
    fireEvent.change(screen.getByLabelText("背景"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("装飾"), { target: { value: "hat" } });
    fireEvent.click(screen.getByRole("button", { name: "アイコンを保存" }));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({ icon_config: { character: "panda", background: 5, decoration: "hat" } }),
    );
  });
});
