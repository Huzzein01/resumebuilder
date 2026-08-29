import type { ProfileDraft } from "@resumebuilder/shared";
import type { LlmProvider } from "./types.js";
import { complete } from "./client.js";
import { buildResumeImportRequest } from "./resumeImportPrompt.js";
import { parseLlmProfileDraft } from "./schemas.js";

export interface LlmResumeImportResult {
  draft: ProfileDraft;
  providerName: string;
  model: string;
}

/**
 * LLM-based resume parsing. Throws (LlmUnavailableError, a JSON/schema
 * validation error, etc.) on any failure -- callers are expected to catch
 * that and fall back to the deterministic parser (parseResumeText), never
 * to surface a broken response to the user.
 */
export async function importProfileWithLlm(
  rawResumeText: string,
  provider?: LlmProvider
): Promise<LlmResumeImportResult> {
  const request = buildResumeImportRequest(rawResumeText);
  const { result: draft, providerName, model } = await complete(
    { ...request, feature: "importResume" },
    parseLlmProfileDraft,
    provider
  );
  return { draft, providerName, model };
}
