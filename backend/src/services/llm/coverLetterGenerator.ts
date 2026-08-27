import type { CoverLetterContent, ContactInfo } from "@resumebuilder/shared";
import type { LlmProvider } from "./types.js";
import { anthropicProvider } from "./providers/anthropic.js";
import { openaiProvider } from "./providers/openai.js";
import { geminiProvider } from "./providers/gemini.js";
import { completeWithFailover } from "./orchestrator.js";
import { buildCoverLetterRequest, type CoverLetterPromptInput } from "./coverLetterPrompt.js";
import { parseLlmCoverLetter } from "./coverLetterSchema.js";

const DEFAULT_PROVIDERS: LlmProvider[] = [anthropicProvider, openaiProvider, geminiProvider];

export interface GenerateCoverLetterInput extends CoverLetterPromptInput {
  contact: ContactInfo;
  hiringManagerName?: string;
}

export interface LlmCoverLetterResult {
  letter: CoverLetterContent;
  providerName: string;
}

/**
 * Opt-in only -- callers gate this behind an explicit user action (a
 * "Generate with AI" click, never automatic), separate from the deterministic
 * buildCoverLetter() which stays the always-available default. Throws on any
 * failure; callers fall back to the deterministic letter, same contract as
 * every other LLM-augmented feature in this app.
 */
export async function generateCoverLetterWithLlm(
  input: GenerateCoverLetterInput,
  providers: LlmProvider[] = DEFAULT_PROVIDERS
): Promise<LlmCoverLetterResult> {
  const request = buildCoverLetterRequest(input);
  const { result, providerName } = await completeWithFailover(providers, request, parseLlmCoverLetter);

  const letter: CoverLetterContent = {
    contact: input.contact,
    companyName: input.companyName,
    hiringManagerName: input.hiringManagerName,
    jobTitle: input.jobTitle,
    ...result,
  };

  return { letter, providerName };
}
