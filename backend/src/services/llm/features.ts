import type { CareerToolInsight } from "@resumebuilder/shared";
import type { LlmProvider } from "./types.js";
import { generateCareerToolInsights } from "./careerToolsGenerator.js";
import { generateResumeHealthSuggestionsWithLlm, type LlmResumeHealthResult } from "./resumeHealthAnalyzer.js";
import { generateCoverLetterWithLlm, type GenerateCoverLetterInput, type LlmCoverLetterResult } from "./coverLetterGenerator.js";
import type { ResumeHealthPromptInput } from "./resumeHealthPrompt.js";
import type { CareerToolsPromptInput } from "./careerToolsPrompt.js";

/**
 * The four editor AI features, each as one named function, all routed
 * through the single shared `complete()` in client.ts -- so which provider
 * runs them is decided entirely by AI_PROVIDER, and no call site anywhere
 * in the app names a provider.
 *
 * These are intentionally thin: LinkedIn Optimizer and Question Generator
 * are both "career tools" that differ only by prompt kind, and previously
 * the only way to invoke them was to pass a magic `kind` string. Naming
 * them makes the app's actual AI surface greppable and gives the debug
 * route (and any future test) one obvious entry point per feature.
 */

export interface CareerToolFeatureResult {
  insights: CareerToolInsight[];
  providerName: string;
  model: string;
}

/** AI Review — critiques the resume and returns strengths + improvement suggestions. */
export function reviewResume(
  input: ResumeHealthPromptInput,
  provider?: LlmProvider
): Promise<LlmResumeHealthResult> {
  return generateResumeHealthSuggestionsWithLlm(input, provider);
}

/** LinkedIn Optimizer — rewrites/advises on profile content for LinkedIn. */
export function optimizeForLinkedIn(
  input: Omit<CareerToolsPromptInput, "kind">,
  provider?: LlmProvider
): Promise<CareerToolFeatureResult> {
  return generateCareerToolInsights({ ...input, kind: "linkedin-optimization" }, provider);
}

/** Question Generator — likely interview questions for the target role/job description. */
export function generateInterviewQuestions(
  input: Omit<CareerToolsPromptInput, "kind">,
  provider?: LlmProvider
): Promise<CareerToolFeatureResult> {
  return generateCareerToolInsights({ ...input, kind: "interview-questions" }, provider);
}

/** AI Cover Letter — generates a full cover letter from the resume + job description. */
export function generateCoverLetter(
  input: GenerateCoverLetterInput,
  provider?: LlmProvider
): Promise<LlmCoverLetterResult> {
  return generateCoverLetterWithLlm(input, provider);
}
