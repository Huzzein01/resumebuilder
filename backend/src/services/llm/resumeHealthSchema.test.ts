import { describe, expect, it } from "vitest";
import { parseLlmResumeHealth } from "./resumeHealthSchema.js";

describe("parseLlmResumeHealth", () => {
  it("parses a valid response", () => {
    const parsed = parseLlmResumeHealth(
      JSON.stringify({
        suggestions: [{ message: "Lead with a stronger verb.", targetType: "bullet", targetId: "b1" }],
      })
    );
    expect(parsed.suggestions).toHaveLength(1);
    expect(parsed.suggestions[0].message).toBe("Lead with a stronger verb.");
  });

  it("defaults to an empty suggestions array when omitted", () => {
    const parsed = parseLlmResumeHealth(JSON.stringify({}));
    expect(parsed.suggestions).toEqual([]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseLlmResumeHealth("not json")).toThrow(/not valid JSON/);
  });

  it("throws when targetType is not bullet or general", () => {
    expect(() =>
      parseLlmResumeHealth(JSON.stringify({ suggestions: [{ message: "x", targetType: "skill" }] }))
    ).toThrow();
  });

  it("throws when a suggestion is missing a message", () => {
    expect(() =>
      parseLlmResumeHealth(JSON.stringify({ suggestions: [{ targetType: "general" }] }))
    ).toThrow();
  });
});
