import type { LlmCompletionRequest, LlmProvider } from "../types.js";

const DEFAULT_MODEL = "gemini-1.5-flash";
const TIMEOUT_MS = 30000;

export const geminiProvider: LlmProvider = {
  name: "gemini",

  isConfigured(): boolean {
    return !!(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY);
  },

  activeModel(): string {
    return process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  },

  async complete({ systemPrompt, userPrompt, maxOutputTokens }: LlmCompletionRequest): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const model = this.activeModel();
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            maxOutputTokens,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) throw new Error("Gemini response had no text content");
    return text;
  },
};
