import { randomUUID } from "node:crypto";
import type { CareerToolInsight } from "@resumebuilder/shared";
import type { LlmProvider } from "./types.js";
import { complete } from "./client.js";
import { buildCareerToolsRequest, type CareerToolsPromptInput } from "./careerToolsPrompt.js";
import { parseLlmCareerTools } from "./careerToolsSchema.js";

export interface CareerToolsGenerationResult {
  insights: CareerToolInsight[];
  providerName: string;
  model: string;
}

/**
 * These five tools (interview questions, career path, career financials,
 * LinkedIn optimization, letter review) are AI-only -- there's no
 * deterministic equivalent to fall back to, so a failure here means "no
 * result," not "a worse result," same contract the caller must handle the
 * same way profileController.getResumeHealthAi does.
 */
export async function generateCareerToolInsights(
  input: CareerToolsPromptInput,
  provider?: LlmProvider
): Promise<CareerToolsGenerationResult> {
  const request = buildCareerToolsRequest(input);
  const { result, providerName, model } = await complete(
    { ...request, feature: `careerTool:${input.kind}` },
    parseLlmCareerTools,
    provider
  );

  const insights: CareerToolInsight[] = result.insights
    .filter((text) => text.trim().length > 0)
    .slice(0, 6)
    .map((message) => ({ id: randomUUID(), message }));

  return { insights, providerName, model };
}
