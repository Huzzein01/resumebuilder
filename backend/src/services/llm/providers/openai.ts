import type { LlmCompletionRequest, LlmProvider } from "../types.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 30000;

export const openaiProvider: LlmProvider = {
  name: "openai",

  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  },

  async complete({ systemPrompt, userPrompt, maxOutputTokens }: LlmCompletionRequest): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
        max_tokens: maxOutputTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenAI response had no message content");
    return text;
  },
};
