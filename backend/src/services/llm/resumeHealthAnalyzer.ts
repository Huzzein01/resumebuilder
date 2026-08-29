import { randomUUID } from "node:crypto";
import type { AiResumeSuggestion } from "@resumebuilder/shared";
import type { LlmProvider } from "./types.js";
import { complete } from "./client.js";
import { buildResumeHealthRequest, type ResumeHealthPromptInput } from "./resumeHealthPrompt.js";
import { parseLlmResumeHealth } from "./resumeHealthSchema.js";

export interface LlmResumeHealthResult {
  strengths: string[];
  suggestions: AiResumeSuggestion[];
  providerName: string;
  model: string;
}

/**
 * Purely additive on top of the deterministic Resume Health scan -- never
 * touches the score (scanResume's rule-based score stays the only score,
 * per the app's "no black-box scoring" principle). Every targetId is
 * re-validated against the bullet ids actually sent in the request; an
 * invented or stale id from the model is dropped down to a general
 * suggestion rather than trusted, the same "never fabricate an id" rule
 * jdEnhanceSchema.ts applies to skill ids.
 */
export async function generateResumeHealthSuggestionsWithLlm(
  input: ResumeHealthPromptInput,
  provider?: LlmProvider
): Promise<LlmResumeHealthResult> {
  const request = buildResumeHealthRequest(input);
  const { result, providerName, model } = await complete(
    { ...request, feature: "reviewResume" },
    parseLlmResumeHealth,
    provider
  );

  const validBulletIds = new Set(input.bullets.map((b) => b.id));
  const suggestions: AiResumeSuggestion[] = result.suggestions
    .slice(0, 5)
    .map((s) => {
      const isValidBulletRef = s.targetType === "bullet" && !!s.targetId && validBulletIds.has(s.targetId);
      return {
        id: randomUUID(),
        message: s.message,
        targetType: isValidBulletRef ? "bullet" : "general",
        targetId: isValidBulletRef ? s.targetId : undefined,
      };
    });

  const strengths = result.strengths.filter((s) => s.trim().length > 0).slice(0, 4);

  return { strengths, suggestions, providerName, model };
}
