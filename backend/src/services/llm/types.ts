export interface LlmCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens: number;
}

export interface LlmProvider {
  /** Short identifier used in logs and error messages -- e.g. "anthropic". */
  name: string;
  /** True if this provider has the env vars it needs to run at all. */
  isConfigured(): boolean;
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
