import { z } from "zod";

export const llmCoverLetterSchema = z.object({
  openingParagraph: z.string(),
  bodyParagraph: z.string(),
  closingParagraph: z.string(),
});

export type LlmCoverLetterDraft = z.infer<typeof llmCoverLetterSchema>;

export function parseLlmCoverLetter(raw: string): LlmCoverLetterDraft {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    throw new Error(`LLM response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  return llmCoverLetterSchema.parse(json);
}
