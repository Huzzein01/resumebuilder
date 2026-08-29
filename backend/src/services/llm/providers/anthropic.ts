import type { LlmCompletionRequest, LlmProvider } from "../types.js";

const DEFAULT_MODEL = "claude-3-5-sonnet-20241022";
const TIMEOUT_MS = 30000;

export const anthropicProvider: LlmProvider = {
  name: "anthropic",

  isConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  },

  activeModel(): string {
    return process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  },

  async complete({ systemPrompt, userPrompt, maxOutputTokens }: LlmCompletionRequest): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.activeModel(),
        max_tokens: maxOutputTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((block) => block.type === "text")?.text;
    if (!text) throw new Error("Anthropic response had no text content");
    return text;
  },
};
