import { z } from "zod";

const llmResumeHealthSuggestionSchema = z.object({
  message: z.string(),
  targetType: z.enum(["bullet", "general"]),
  targetId: z.string().optional(),
});

export const llmResumeHealthSchema = z.object({
  strengths: z.array(z.string()).default([]),
  suggestions: z.array(llmResumeHealthSuggestionSchema).default([]),
});

export type LlmResumeHealthSuggestion = z.infer<typeof llmResumeHealthSuggestionSchema>;
export type LlmResumeHealthResponse = z.infer<typeof llmResumeHealthSchema>;

export function parseLlmResumeHealth(raw: string): LlmResumeHealthResponse {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    throw new Error(`LLM response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  return llmResumeHealthSchema.parse(json);
}
