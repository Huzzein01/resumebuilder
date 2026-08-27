import type { LlmCompletionRequest, LlmProvider } from "./types.js";
import { LlmUnavailableError } from "./types.js";

export interface LlmFailoverResult<T> {
  result: T;
  providerName: string;
}

/**
 * Tries each configured provider in order, moving to the next on ANY
 * failure -- a network/HTTP error, but also `parseResponse` throwing on a
 * response that isn't valid JSON or doesn't match the expected schema.
 *
 * Validation deliberately happens *inside* this loop (via the parseResponse
 * callback) rather than being left to the caller after failover has already
 * concluded: an LLM occasionally returning malformed output is a normal
 * failure mode, not a rarer case than a network error, so a provider that
 * responds but produces garbage must be just as failover-able as one that's
 * down or rate-limited -- otherwise the whole request fails even when a
 * different configured provider would have succeeded.
 */
export async function completeWithFailover<T>(
  providers: LlmProvider[],
  request: LlmCompletionRequest,
  parseResponse: (raw: string) => T
): Promise<LlmFailoverResult<T>> {
  const configured = providers.filter((p) => p.isConfigured());
  if (configured.length === 0) {
    throw new LlmUnavailableError("No LLM provider is configured (no API key set for any provider)");
  }

  const errors: string[] = [];
  for (const provider of configured) {
    try {
      const raw = await provider.complete(request);
      const result = parseResponse(raw);
      return { result, providerName: provider.name };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.name}: ${message}`);
    }
  }

  throw new LlmUnavailableError(`All configured LLM providers failed -- ${errors.join("; ")}`);
}
