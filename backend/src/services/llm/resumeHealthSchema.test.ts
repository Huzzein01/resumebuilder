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

  it("defaults to empty strengths and suggestions arrays when omitted", () => {
    const parsed = parseLlmResumeHealth(JSON.stringify({}));
    expect(parsed.suggestions).toEqual([]);
    expect(parsed.strengths).toEqual([]);
  });

  it("parses strengths", () => {
    const parsed = parseLlmResumeHealth(
      JSON.stringify({ strengths: ["Clear, quantified impact in the top bullet."], suggestions: [] })
    );
    expect(parsed.strengths).toEqual(["Clear, quantified impact in the top bullet."]);
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
