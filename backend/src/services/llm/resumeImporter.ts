import type { ProfileDraft } from "@resumebuilder/shared";
import type { LlmProvider } from "./types.js";
import { anthropicProvider } from "./providers/anthropic.js";
import { openaiProvider } from "./providers/openai.js";
import { geminiProvider } from "./providers/gemini.js";
import { localProvider } from "./providers/local.js";
import { completeWithFailover } from "./orchestrator.js";
import { buildResumeImportRequest } from "./resumeImportPrompt.js";
import { parseLlmProfileDraft } from "./schemas.js";

// Order reflects the multi-provider failover already proven out in
// SwipeConnect -- if one provider is down or rate-limited, the next is
// tried automatically. `providers` is a parameter (not a hardcoded import
// inside the function) specifically so tests can inject mocks instead of
// making real network calls.
const DEFAULT_PROVIDERS: LlmProvider[] = [anthropicProvider, openaiProvider, geminiProvider, localProvider];

export interface LlmResumeImportResult {
  draft: ProfileDraft;
  providerName: string;
}

/**
 * LLM-based resume parsing. Throws (LlmUnavailableError, a JSON/schema
 * validation error, etc.) on any failure -- callers are expected to catch
 * that and fall back to the deterministic parser (parseResumeText), never
 * to surface a broken response to the user.
 */
export async function importProfileWithLlm(
  rawResumeText: string,
  providers: LlmProvider[] = DEFAULT_PROVIDERS
): Promise<LlmResumeImportResult> {
  const request = buildResumeImportRequest(rawResumeText);
  const { result: draft, providerName } = await completeWithFailover(providers, request, parseLlmProfileDraft);
  return { draft, providerName };
}
