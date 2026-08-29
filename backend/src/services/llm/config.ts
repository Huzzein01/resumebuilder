import { LlmConfigurationError, type LlmProvider } from "./types.js";
import { ollamaProvider } from "./providers/ollama.js";
import { anthropicProvider } from "./providers/anthropic.js";
import { openaiProvider } from "./providers/openai.js";
import { geminiProvider } from "./providers/gemini.js";

/**
 * ollama and anthropic are the two that matter: local model for development
 * at zero cost, Anthropic for production. openai/gemini stay registered
 * because their adapters already exist and work -- selectable if wanted,
 * costing nothing by being listed here.
 */
const PROVIDERS: Record<string, LlmProvider> = {
  ollama: ollamaProvider,
  anthropic: anthropicProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
};

/** Local-first by default: the app must be fully exercisable with no API key and no spend. */
const DEFAULT_PROVIDER = "ollama";

export function activeProviderName(): string {
  return (process.env.AI_PROVIDER ?? DEFAULT_PROVIDER).trim().toLowerCase();
}

/**
 * Resolves the single provider named by AI_PROVIDER. Exactly one provider
 * serves a request -- there is deliberately no failover chain across
 * providers, because silently answering with a different model than the one
 * configured makes output impossible to attribute when comparing quality
 * (and would quietly send prompts to a paid API when a local one was asked
 * for, or vice versa).
 *
 * Throws LlmConfigurationError rather than falling back when the selection
 * can't be honored -- an unknown name, or anthropic with no key. Callers
 * already treat a throw here as "no AI result", so a misconfiguration
 * surfaces as a clear logged error instead of a silent provider swap.
 */
export function resolveProvider(): LlmProvider {
  const name = activeProviderName();
  const provider = PROVIDERS[name];

  if (!provider) {
    throw new LlmConfigurationError(
      `Unknown AI_PROVIDER "${name}". Valid values: ${Object.keys(PROVIDERS).join(", ")}.`
    );
  }

  if (!provider.isConfigured()) {
    throw new LlmConfigurationError(
      `AI_PROVIDER is "${name}" but it isn't configured — ${missingConfigHint(name)}. ` +
        `Not falling back to another provider: the selected one is used or the request fails.`
    );
  }

  return provider;
}

function missingConfigHint(name: string): string {
  switch (name) {
    case "anthropic":
      return "set ANTHROPIC_API_KEY (and optionally ANTHROPIC_MODEL)";
    case "openai":
      return "set OPENAI_API_KEY";
    case "gemini":
      return "set GEMINI_API_KEY";
    default:
      return "check its environment variables";
  }
}
