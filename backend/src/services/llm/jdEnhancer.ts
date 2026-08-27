import type { ExtractedRequirements } from "@resumebuilder/shared";
import type { LlmProvider } from "./types.js";
import { anthropicProvider } from "./providers/anthropic.js";
import { openaiProvider } from "./providers/openai.js";
import { geminiProvider } from "./providers/gemini.js";
import { completeWithFailover } from "./orchestrator.js";
import { buildJdEnhanceRequest } from "./jdEnhancePrompt.js";
import { parseLlmJdAnalysis, mergeLlmJdAnalysis } from "./jdEnhanceSchema.js";

const DEFAULT_PROVIDERS: LlmProvider[] = [anthropicProvider, openaiProvider, geminiProvider];

export interface LlmJdEnhanceResult {
  requirements: ExtractedRequirements;
  additionalSkillsDetected: string[];
  providerName: string;
}

/**
 * Enhances (never replaces) the deterministic jdExtractor.ts result. Throws
 * on any failure -- callers must catch and fall back to the deterministic
 * requirements alone, same contract as importProfileWithLlm.
 */
export async function enhanceRequirementsWithLlm(
  rawJdText: string,
  deterministic: ExtractedRequirements,
  providers: LlmProvider[] = DEFAULT_PROVIDERS
): Promise<LlmJdEnhanceResult> {
  const request = buildJdEnhanceRequest(rawJdText);
  const { result, providerName } = await completeWithFailover(providers, request, parseLlmJdAnalysis);
  const { requirements, additionalSkillsDetected } = mergeLlmJdAnalysis(deterministic, result);
  return { requirements, additionalSkillsDetected, providerName };
}
