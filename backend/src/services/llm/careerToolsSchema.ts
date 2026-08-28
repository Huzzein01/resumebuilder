import { z } from "zod";

export const llmCareerToolsSchema = z.object({
  insights: z.array(z.string()).default([]),
});

export type LlmCareerToolsResponse = z.infer<typeof llmCareerToolsSchema>;

export function parseLlmCareerTools(raw: string): LlmCareerToolsResponse {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    throw new Error(`LLM response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  return llmCareerToolsSchema.parse(json);
}
