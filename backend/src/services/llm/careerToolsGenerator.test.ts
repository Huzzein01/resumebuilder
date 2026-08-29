import { describe, expect, it, vi } from "vitest";
import { generateCareerToolInsights } from "./careerToolsGenerator.js";
import type { LlmProvider } from "./types.js";

function mockProvider(name: string, complete: LlmProvider["complete"], configured = true): LlmProvider {
  return { name, isConfigured: () => configured, activeModel: () => `${name}-model`, complete: vi.fn(complete) };
}

describe("generateCareerToolInsights", () => {
  it("returns insights with server-assigned ids", async () => {
    const provider = mockProvider("anthropic", async () => JSON.stringify({ insights: ["Do X.", "Do Y."] }));

    const result = await generateCareerToolInsights(
      { kind: "career-path", summary: "Engineer.", skills: ["Node.js"], recentTitles: ["Backend Engineer"] },
      provider
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
      provider
    );

    expect(result.insights).toHaveLength(6);
  });

  // Provider *selection* (and refusing to fall back to a different one) is
  // config.ts's job now, covered in config.test.ts -- at this layer the
  // contract is simply that a bad response surfaces rather than being
  // silently retried against some other model.
  it("propagates the error when the provider returns malformed JSON", async () => {
    const broken = mockProvider("broken", async () => "not json");

    await expect(
      generateCareerToolInsights({ kind: "career-financials", summary: "", skills: [], recentTitles: [] }, broken)
    ).rejects.toThrow();
  });

  it("reports the provider and model that produced the result", async () => {
    const provider = mockProvider("ollama", async () => JSON.stringify({ insights: ["ok"] }));

    const result = await generateCareerToolInsights(
      { kind: "career-path", summary: "", skills: [], recentTitles: [] },
      provider
    );

    expect(result.providerName).toBe("ollama");
    expect(result.model).toBe("ollama-model");
  });
});
