import { LlmUnreachableError, type LlmCompletionRequest, type LlmProvider } from "../types.js";

// Ollama's OpenAI-compatible surface. BASE_URL is the server root (no /v1)
// so it reads the same as Ollama's own docs and the OLLAMA_HOST people
// already set; the /v1 path is appended here. Anything else speaking the
// same OpenAI chat-completions shape (LM Studio, vLLM, llama.cpp's server)
// works by pointing OLLAMA_BASE_URL at it.
const DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.1";

// Measured ~52s for one resume-health call (7B model, CPU inference) on
// ordinary consumer hardware; 60s timed out in practice. Local inference is
// simply slower than a hosted API, so this is generous on purpose -- but
// still bounded, so a wedged server fails rather than hanging forever.
const TIMEOUT_MS = 120000;

function baseUrl(): string {
  return (process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
}

/**
 * Local/self-hosted model -- the default provider, so the whole app can be
 * built and exercised at zero cost with no API key. Deliberately no key
 * check in isConfigured(): a local server needs no credentials, and the
 * only way to know it's actually up is to call it, which complete() does
 * with a clear LlmUnreachableError if it isn't.
 *
 * Non-streaming. If the UI later wants token-by-token output (cover letter
 * generation is the obvious candidate -- it's the longest single response
 * and the one where waiting feels worst), add `stream: true` here and
 * surface an async iterator; the OpenAI-compatible SSE format Ollama emits
 * is the same one the Anthropic adapter would need, so the streaming seam
 * belongs in this interface rather than in any one provider.
 */
export const ollamaProvider: LlmProvider = {
  name: "ollama",

  isConfigured(): boolean {
    return true;
  },

  activeModel(): string {
    return process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;
  },

  async complete({ systemPrompt, userPrompt, maxOutputTokens }: LlmCompletionRequest): Promise<string> {
    const url = `${baseUrl()}/v1/chat/completions`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.activeModel(),
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
      // "Couldn't reach it at all" is a different problem to debug than
      // "reached it and it complained", and in development it nearly always
      // means the server just isn't running -- so say that explicitly
      // instead of surfacing a bare fetch/AbortError.
      throw new LlmUnreachableError(
        `Can't reach Ollama at ${baseUrl()} — is it running? (start it with \`ollama serve\`, then \`ollama pull ${this.activeModel()}\`)`,
        { cause: err }
      );
    }

    if (!res.ok) {
      const body = await res.text();
      // A 404 from Ollama specifically means the model isn't pulled -- a
      // distinct, very common, and easily-fixed mistake worth calling out
      // rather than lumping in with generic HTTP failures.
      if (res.status === 404) {
        throw new Error(
          `Ollama has no model named "${this.activeModel()}" — pull it first: \`ollama pull ${this.activeModel()}\` (${body})`
        );
      }
      throw new Error(`Ollama error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Ollama response had no message content");
    return text;
  },
};
