export interface LlmCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens: number;
}

export interface LlmProvider {
  /** Short identifier used in logs and error messages -- e.g. "anthropic". Matches the AI_PROVIDER value that selects it. */
  name: string;
  /** True if this provider has the env vars it needs to run at all. */
  isConfigured(): boolean;
  /** The model id this provider would actually call right now -- logged alongside `name` so output can be compared across provider/model pairs later. */
  activeModel(): string;
  /** Returns the raw text of the model's reply (expected to be JSON, but not parsed here). */
  complete(request: LlmCompletionRequest): Promise<string>;
}

export class LlmUnavailableError extends Error {
  declare cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "LlmUnavailableError";
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

/**
 * The selected provider can't run as configured -- an unknown AI_PROVIDER
 * value, or AI_PROVIDER=anthropic with no ANTHROPIC_API_KEY. Deliberately
 * distinct from LlmUnavailableError: this is a deployment/config mistake
 * that should be fixed, not a transient "the model didn't answer", and it
 * must never be papered over by silently using a different provider than
 * the one that was explicitly asked for.
 */
export class LlmConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmConfigurationError";
  }
}

/**
 * The provider's server couldn't be reached at all (as opposed to answering
 * with an error). Carries a message naming the actual URL tried, since the
 * overwhelmingly common cause in development is simply that Ollama isn't
 * running yet.
 */
export class LlmUnreachableError extends Error {
  declare cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "LlmUnreachableError";
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}
