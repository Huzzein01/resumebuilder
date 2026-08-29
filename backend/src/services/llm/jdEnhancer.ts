import type { ExtractedRequirements } from "@resumebuilder/shared";
import type { LlmProvider } from "./types.js";
import { complete } from "./client.js";
import { buildJdEnhanceRequest } from "./jdEnhancePrompt.js";
import { parseLlmJdAnalysis, mergeLlmJdAnalysis } from "./jdEnhanceSchema.js";

export interface LlmJdEnhanceResult {
  requirements: ExtractedRequirements;
  additionalSkillsDetected: string[];
  providerName: string;
  model: string;
}

/**
 * Enhances (never replaces) the deterministic jdExtractor.ts result. Throws
 * on any failure -- callers must catch and fall back to the deterministic
 * requirements alone, same contract as importProfileWithLlm.
 */
export async function enhanceRequirementsWithLlm(
  rawJdText: string,
  deterministic: ExtractedRequirements,
  provider?: LlmProvider
): Promise<LlmJdEnhanceResult> {
  const request = buildJdEnhanceRequest(rawJdText);
  const { result, providerName, model } = await complete(
    { ...request, feature: "enhanceJobDescription" },
    parseLlmJdAnalysis,
    provider
  );
  const { requirements, additionalSkillsDetected } = mergeLlmJdAnalysis(deterministic, result);
  return { requirements, additionalSkillsDetected, providerName, model };
}
