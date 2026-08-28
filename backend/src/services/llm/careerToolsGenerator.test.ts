import { describe, expect, it, vi } from "vitest";
import { generateCareerToolInsights } from "./careerToolsGenerator.js";
import { LlmUnavailableError } from "./types.js";
import type { LlmProvider } from "./types.js";

function mockProvider(name: string, complete: LlmProvider["complete"], configured = true): LlmProvider {
  return { name, isConfigured: () => configured, complete: vi.fn(complete) };
}

describe("generateCareerToolInsights", () => {
  it("returns insights with server-assigned ids", async () => {
    const provider = mockProvider("anthropic", async () => JSON.stringify({ insights: ["Do X.", "Do Y."] }));

    const result = await generateCareerToolInsights(
      { kind: "career-path", summary: "Engineer.", skills: ["Node.js"], recentTitles: ["Backend Engineer"] },
      [provider]
    );

    expect(result.providerName).toBe("anthropic");
    expect(result.insights).toHaveLength(2);
    expect(result.insights[0].id).toBeTruthy();
    expect(result.insights[0].message).toBe("Do X.");
  });

  it("caps insights at 6 and drops empty strings", async () => {
    const many = ["", ...Array.from({ length: 8 }, (_, i) => `Insight ${i}`)];
    const provider = mockProvider("anthropic", async () => JSON.stringify({ insights: many }));

    const result = await generateCareerToolInsights(
      { kind: "interview-questions", summary: "", skills: [], recentTitles: [] },
      [provider]
    );

    expect(result.insights).toHaveLength(6);
  });

  it("propagates LlmUnavailableError when no provider is configured", async () => {
    const unconfigured = mockProvider("unconfigured", async () => "{}", false);

    await expect(
      generateCareerToolInsights({ kind: "linkedin-optimization", summary: "", skills: [], recentTitles: [] }, [
        unconfigured,
      ])
    ).rejects.toThrow(LlmUnavailableError);
  });

  it("falls through to the next provider on malformed JSON", async () => {
    const broken = mockProvider("broken", async () => "not json");
    const working = mockProvider("working", async () => JSON.stringify({ insights: ["ok"] }));

    const result = await generateCareerToolInsights(
      { kind: "career-financials", summary: "", skills: [], recentTitles: [] },
      [broken, working]
    );

    expect(result.providerName).toBe("working");
  });
});
