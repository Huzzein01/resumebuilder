import { describe, expect, it, vi } from "vitest";
import { generateResumeHealthSuggestionsWithLlm } from "./resumeHealthAnalyzer.js";
import type { LlmProvider } from "./types.js";

function mockProvider(name: string, complete: LlmProvider["complete"], configured = true): LlmProvider {
  return { name, isConfigured: () => configured, activeModel: () => `${name}-model`, complete: vi.fn(complete) };
}

const BULLETS = [{ id: "b1", text: "Built a payments service.", context: "\"Engineer\" at Acme" }];

const PROFILE_SHAPE = {
  skillCount: 1,
  workExperienceCount: 1,
  projectCount: 0,
  educationCount: 0,
  certificationCount: 0,
};

describe("generateResumeHealthSuggestionsWithLlm", () => {
  it("returns suggestions with server-assigned ids", async () => {
    const provider = mockProvider("anthropic", async () =>
      JSON.stringify({
        strengths: [],
        suggestions: [{ message: "Quantify the payments volume.", targetType: "bullet", targetId: "b1" }],
      })
    );

    const result = await generateResumeHealthSuggestionsWithLlm(
      { summary: "Engineer.", bullets: BULLETS, alreadyFlaggedCategories: [], profileShape: PROFILE_SHAPE },
      provider
    );

    expect(result.providerName).toBe("anthropic");
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].id).toBeTruthy();
    expect(result.suggestions[0].targetType).toBe("bullet");
    expect(result.suggestions[0].targetId).toBe("b1");
  });

  it("returns strengths alongside suggestions", async () => {
    const provider = mockProvider("anthropic", async () =>
      JSON.stringify({
        strengths: ["The payments bullet is well-quantified.", "Good breadth of backend skills."],
        suggestions: [],
      })
    );

    const result = await generateResumeHealthSuggestionsWithLlm(
      { summary: "", bullets: BULLETS, alreadyFlaggedCategories: [], profileShape: PROFILE_SHAPE },
      provider
    );

    expect(result.strengths).toEqual([
      "The payments bullet is well-quantified.",
      "Good breadth of backend skills.",
    ]);
  });

  it("caps strengths at 4 and drops empty strings", async () => {
    const many = ["", "a", "b", "c", "d", "e"];
    const provider = mockProvider("anthropic", async () => JSON.stringify({ strengths: many, suggestions: [] }));

    const result = await generateResumeHealthSuggestionsWithLlm(
      { summary: "", bullets: [], alreadyFlaggedCategories: [], profileShape: PROFILE_SHAPE },
      provider
    );

    expect(result.strengths).toHaveLength(4);
  });

  it("downgrades a suggestion referencing an unknown bullet id to general rather than trusting it", async () => {
    const provider = mockProvider("anthropic", async () =>
      JSON.stringify({
        strengths: [],
        suggestions: [{ message: "Some feedback.", targetType: "bullet", targetId: "not-a-real-id" }],
      })
    );

    const result = await generateResumeHealthSuggestionsWithLlm(
      { summary: "", bullets: BULLETS, alreadyFlaggedCategories: [], profileShape: PROFILE_SHAPE },
      provider
    );

    expect(result.suggestions[0].targetType).toBe("general");
    expect(result.suggestions[0].targetId).toBeUndefined();
  });

  it("caps suggestions at 5 even if the model returns more", async () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ message: `Suggestion ${i}`, targetType: "general" }));
    const provider = mockProvider("anthropic", async () => JSON.stringify({ strengths: [], suggestions: many }));

    const result = await generateResumeHealthSuggestionsWithLlm(
      { summary: "", bullets: [], alreadyFlaggedCategories: [], profileShape: PROFILE_SHAPE },
      provider
    );

    expect(result.suggestions).toHaveLength(5);
  });

  it("propagates the error when the provider returns malformed JSON", async () => {
    const broken = mockProvider("broken", async () => "not json");

    await expect(
      generateResumeHealthSuggestionsWithLlm(
        { summary: "", bullets: [], alreadyFlaggedCategories: [], profileShape: PROFILE_SHAPE },
        broken
      )
    ).rejects.toThrow();
  });

  it("reports the provider and model that produced the result", async () => {
    const provider = mockProvider("ollama", async () => JSON.stringify({ strengths: [], suggestions: [] }));

    const result = await generateResumeHealthSuggestionsWithLlm(
      { summary: "", bullets: [], alreadyFlaggedCategories: [], profileShape: PROFILE_SHAPE },
      provider
    );

    expect(result.providerName).toBe("ollama");
    expect(result.model).toBe("ollama-model");
  });
});
