import { resolveProvider } from "./config.js";
import type { LlmProvider } from "./types.js";

export interface LlmCallResult<T> {
  result: T;
  /** Which provider actually served this -- surfaced in responses and logs so output is attributable when comparing models. */
  providerName: string;
  /** The exact model id, e.g. "llama3.1" or "claude-3-5-sonnet-20241022". */
  model: string;
}

export interface CompleteOptions {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens: number;
  /** Feature name for the log line ("reviewResume", "generateCoverLetter", ...). */
  feature: string;
}

/**
 * The single call path every AI feature goes through. Feature modules own
 * their prompt and their response schema; everything provider-shaped --
 * which provider, logging, error translation -- lives here exactly once,
 * so switching providers is a config change and never a code change at any
 * call site.
 *
 * `provider` is a parameter (defaulting to the AI_PROVIDER selection) purely
 * as a test seam, so unit tests inject a fake instead of making real network
 * calls. Production code never passes it.
 */
export async function complete<T>(
  { systemPrompt, userPrompt, maxOutputTokens, feature }: CompleteOptions,
  parseResponse: (raw: string) => T,
  provider: LlmProvider = resolveProvider()
): Promise<LlmCallResult<T>> {
  const model = provider.activeModel();
  const startedAt = Date.now();

  try {
    const raw = await provider.complete({ systemPrompt, userPrompt, maxOutputTokens });
    const result = parseResponse(raw);
    console.info(`[ai] ${feature} ok — provider=${provider.name} model=${model} ${Date.now() - startedAt}ms`);
    return { result, providerName: provider.name, model };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[ai] ${feature} failed — provider=${provider.name} model=${model}: ${detail}`);

    // Re-thrown as-is, deliberately not wrapped: the provider-level errors
    // carry the messages that actually tell a developer what to do ("Can't
    // reach Ollama at ... — is it running?", "pull it first"), and wrapping
    // would bury them under a generic one.
    throw err;
  }
}
