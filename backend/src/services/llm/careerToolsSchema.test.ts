import { describe, expect, it } from "vitest";
import { parseLlmCareerTools } from "./careerToolsSchema.js";

describe("parseLlmCareerTools", () => {
  it("parses a valid response", () => {
    const parsed = parseLlmCareerTools(JSON.stringify({ insights: ["First insight.", "Second insight."] }));
    expect(parsed.insights).toEqual(["First insight.", "Second insight."]);
  });

  it("defaults to an empty array when omitted", () => {
    expect(parseLlmCareerTools(JSON.stringify({})).insights).toEqual([]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseLlmCareerTools("not json")).toThrow(/not valid JSON/);
  });

  it("throws when insights is not an array of strings", () => {
    expect(() => parseLlmCareerTools(JSON.stringify({ insights: [{ text: "x" }] }))).toThrow();
  });
});
