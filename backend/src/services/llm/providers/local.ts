import type { LlmCompletionRequest, LlmProvider } from "../types.js";

// Ollama's OpenAI-compatible endpoint -- the most common local setup, and
// the same request/response shape LM Studio, vLLM, and llama.cpp's server
// all speak too, so this one provider covers any of them by just pointing
// LOCAL_LLM_BASE_URL elsewhere.
const DEFAULT_BASE_URL = "http://localhost:11434/v1";
// Measured ~52s for a single resume-health call (7B model, CPU inference,
// ~140 total tokens) on ordinary consumer hardware -- 60s was cutting that
// too close in practice (timed out on a live request). 120s gives real
// headroom for a slower machine or a longer prompt without the request
// hanging indefinitely if the server is genuinely down.
const TIMEOUT_MS = 120000;

/**
 * Self-hosted/open-weight model as a last-resort backup -- no API key, no
 * per-token cost, no external dependency at all once the model is pulled;
 * the tradeoff is output quality and speed versus the hosted providers
 * above it, which is exactly why it's ordered last in every DEFAULT_PROVIDERS
 * list rather than first.
 *
 * Deliberately opt-in only (isConfigured requires LOCAL_LLM_MODEL to be set
 * explicitly, no default) -- a dev machine that happens to have Ollama
 * running for something unrelated shouldn't silently start receiving this
 * app's prompts just because the port is open.
 */
export const localProvider: LlmProvider = {
  name: "local",

  isConfigured(): boolean {
    return !!process.env.LOCAL_LLM_MODEL;
  },

  async complete({ systemPrompt, userPrompt, maxOutputTokens }: LlmCompletionRequest): Promise<string> {
    const model = process.env.LOCAL_LLM_MODEL;
    if (!model) throw new Error("LOCAL_LLM_MODEL is not set");
    const baseUrl = (process.env.LOCAL_LLM_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          max_tokens: maxOutputTokens,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      // Distinct message from an HTTP error response -- "couldn't even reach
      // it" (server not running, wrong port) is a different failure to debug
      // than "reached it and it returned an error."
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Local LLM server unreachable at ${baseUrl}: ${message}`);
    }

    if (!res.ok) {
      throw new Error(`Local LLM server error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Local LLM response had no message content");
    return text;
  },
};
