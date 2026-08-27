import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { isAiModeRequested } from "./aiMode.js";

function fakeRequest(headerValue: string | undefined): Request {
  return { header: () => headerValue } as unknown as Request;
}

describe("isAiModeRequested", () => {
  it("returns true when the header is exactly 'true'", () => {
    expect(isAiModeRequested(fakeRequest("true"))).toBe(true);
  });

  it("returns false when the header is missing", () => {
    expect(isAiModeRequested(fakeRequest(undefined))).toBe(false);
  });

  it("returns false for any value other than the literal string 'true' (fails closed)", () => {
    expect(isAiModeRequested(fakeRequest("false"))).toBe(false);
    expect(isAiModeRequested(fakeRequest("1"))).toBe(false);
    expect(isAiModeRequested(fakeRequest("TRUE"))).toBe(false);
    expect(isAiModeRequested(fakeRequest(""))).toBe(false);
  });
});
