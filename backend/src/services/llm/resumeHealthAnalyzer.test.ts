import { describe, expect, it, vi } from "vitest";
import { generateResumeHealthSuggestionsWithLlm } from "./resumeHealthAnalyzer.js";
import { LlmUnavailableError } from "./types.js";
import type { LlmProvider } from "./types.js";

function mockProvider(name: string, complete: LlmProvider["complete"], configured = true): LlmProvider {
  return { name, isConfigured: () => configured, complete: vi.fn(complete) };
}

const BULLETS = [{ id: "b1", text: "Built a payments service.", context: "\"Engineer\" at Acme" }];

describe("generateResumeHealthSuggestionsWithLlm", () => {
  it("returns suggestions with server-assigned ids", async () => {
    const provider = mockProvider("anthropic", async () =>
      JSON.stringify({
        suggestions: [{ message: "Quantify the payments volume.", targetType: "bullet", targetId: "b1" }],
      })
    );

    const result = await generateResumeHealthSuggestionsWithLlm(
      { summary: "Engineer.", bullets: BULLETS, alreadyFlaggedCategories: [] },
      [provider]
    );

    expect(result.providerName).toBe("anthropic");
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].id).toBeTruthy();
    expect(result.suggestions[0].targetType).toBe("bullet");
    expect(result.suggestions[0].targetId).toBe("b1");
  });

  it("downgrades a suggestion referencing an unknown bullet id to general rather than trusting it", async () => {
    const provider = mockProvider("anthropic", async () =>
      JSON.stringify({
        suggestions: [{ message: "Some feedback.", targetType: "bullet", targetId: "not-a-real-id" }],
      })
    );

    const result = await generateResumeHealthSuggestionsWithLlm(
      { summary: "", bullets: BULLETS, alreadyFlaggedCategories: [] },
      [provider]
    );

    expect(result.suggestions[0].targetType).toBe("general");
    expect(result.suggestions[0].targetId).toBeUndefined();
  });

  it("caps suggestions at 5 even if the model returns more", async () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ message: `Suggestion ${i}`, targetType: "general" }));
    const provider = mockProvider("anthropic", async () => JSON.stringify({ suggestions: many }));

    const result = await generateResumeHealthSuggestionsWithLlm(
      { summary: "", bullets: [], alreadyFlaggedCategories: [] },
      [provider]
    );

    expect(result.suggestions).toHaveLength(5);
  });

  it("propagates LlmUnavailableError when no provider is configured", async () => {
    const unconfigured = mockProvider("unconfigured", async () => "{}", false);

    await expect(
      generateResumeHealthSuggestionsWithLlm(
        { summary: "", bullets: [], alreadyFlaggedCategories: [] },
        [unconfigured]
      )
    ).rejects.toThrow(LlmUnavailableError);
  });

  it("falls through to the next provider on malformed JSON", async () => {
    const broken = mockProvider("broken", async () => "not json");
    const working = mockProvider("working", async () => JSON.stringify({ suggestions: [] }));

    const result = await generateResumeHealthSuggestionsWithLlm(
      { summary: "", bullets: [], alreadyFlaggedCategories: [] },
      [broken, working]
    );

    expect(result.providerName).toBe("working");
  });
});
