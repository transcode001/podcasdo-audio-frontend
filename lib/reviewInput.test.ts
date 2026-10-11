import { describe, expect, it } from "vitest";
import { normalizeBody, validateReview } from "./reviewInput";

describe("normalizeBody", () => {
  it("returns null for blank-only input", () => {
    expect(normalizeBody("   ")).toBeNull();
    expect(normalizeBody("　\t\n")).toBeNull();
    expect(normalizeBody("")).toBeNull();
  });
  it("trims ends and unifies newlines", () => {
    expect(normalizeBody("  hi  ")).toBe("hi");
    expect(normalizeBody("a\r\nb")).toBe("a\nb");
  });
  it("keeps inner whitespace", () => {
    expect(normalizeBody("a b\nc")).toBe("a b\nc");
  });
});

describe("validateReview", () => {
  it("maps stars to the internal 1..10 rating", () => {
    expect(validateReview(0.5, "")).toEqual({ ok: true, value: { rating: 1, body: null } });
    expect(validateReview(4.0, "text")).toEqual({ ok: true, value: { rating: 8, body: "text" } });
    expect(validateReview(5.0, "")).toEqual({ ok: true, value: { rating: 10, body: null } });
  });

  it("rejects a body-only post (no star)", () => {
    const r = validateReview(null, "great");
    expect(r.ok).toBe(false);
  });

  it("treats blank-only body as no body (with a star)", () => {
    expect(validateReview(3.0, "   \n")).toEqual({ ok: true, value: { rating: 6, body: null } });
  });

  it("accepts 1999 and 2000 chars, rejects 2001", () => {
    expect(validateReview(4.0, "a".repeat(1999)).ok).toBe(true);
    expect(validateReview(4.0, "a".repeat(2000)).ok).toBe(true);
    expect(validateReview(4.0, "a".repeat(2001)).ok).toBe(false);
  });
});
