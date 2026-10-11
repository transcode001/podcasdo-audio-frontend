import { describe, expect, it } from "vitest";
import { ratingToStars, starsToRating } from "./rating";
import { validateNickname } from "./profileInput";
import { retryAfterMessage, toUserMessage } from "./errorMessage";
import { getCsrfToken } from "./csrf";
import { ApiError } from "./api";

describe("rating conversion", () => {
  it("converts stars to internal rating", () => {
    expect(starsToRating(0.5)).toBe(1);
    expect(starsToRating(4.0)).toBe(8);
    expect(starsToRating(5.0)).toBe(10);
  });
  it("rejects out-of-range or off-step stars", () => {
    expect(starsToRating(0)).toBeNull();
    expect(starsToRating(5.5)).toBeNull();
    expect(starsToRating(0.3)).toBeNull();
  });
  it("round-trips", () => {
    expect(ratingToStars(8)).toBe(4);
  });
});

describe("validateNickname", () => {
  it("trims and accepts 1..20", () => {
    expect(validateNickname("  ねこ ")).toEqual({ ok: true, value: "ねこ" });
    expect(validateNickname("a".repeat(20)).ok).toBe(true);
  });
  it("rejects empty, over-length and control chars", () => {
    expect(validateNickname("   ").ok).toBe(false);
    expect(validateNickname("a".repeat(21)).ok).toBe(false);
    expect(validateNickname("a\nb").ok).toBe(false);
    expect(validateNickname("a\u0001b").ok).toBe(false);
  });
});

describe("toUserMessage", () => {
  it("maps statuses to user messages without leaking internals", () => {
    expect(toUserMessage(new ApiError(401, "unauthorized", "x", "req-secret"))).toBe("ログインが必要です。");
    expect(toUserMessage(new ApiError(403, "forbidden", "x"))).toContain("権限");
    expect(toUserMessage(new ApiError(404, "not_found", "x"))).toContain("見つかりません");
    expect(toUserMessage(new ApiError(409, "conflict", "x"))).toContain("すでに");
    expect(toUserMessage(new ApiError(429, "rate_limited", "x"))).toContain("回数制限");
    expect(toUserMessage(new ApiError(502, "provider_unavailable", "x"))).toContain("取得できません");
    expect(toUserMessage(new ApiError(0, "network_error", "x"))).toContain("接続できません");
    // request_id must never appear in the user message.
    expect(toUserMessage(new ApiError(401, "unauthorized", "x", "req-secret"))).not.toContain("req-secret");
  });
  it("passes through 400 validation text from the Backend", () => {
    expect(toUserMessage(new ApiError(400, "invalid_request", "本文は2000文字以内で入力してください"))).toBe(
      "本文は2000文字以内で入力してください",
    );
  });
});

describe("retryAfterMessage", () => {
  it("formats seconds and minutes", () => {
    expect(retryAfterMessage(null)).toBe("");
    expect(retryAfterMessage(30)).toContain("30秒");
    expect(retryAfterMessage(120)).toContain("2分");
  });
});

describe("getCsrfToken", () => {
  it("reads the csrf cookie value", () => {
    document.cookie = "podcasdo_csrf=tok-123";
    expect(getCsrfToken()).toBe("tok-123");
  });
});
