import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { activeProviderName, resolveProvider } from "./config.js";
import { LlmConfigurationError } from "./types.js";

const ENV_KEYS = ["AI_PROVIDER", "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"] as const;
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("activeProviderName", () => {
  it("defaults to ollama when AI_PROVIDER is unset", () => {
    expect(activeProviderName()).toBe("ollama");
  });

  it("reads AI_PROVIDER case-insensitively", () => {
    process.env.AI_PROVIDER = "Anthropic";
    expect(activeProviderName()).toBe("anthropic");
  });
});

describe("resolveProvider", () => {
  it("resolves to ollama by default with no key of any kind required", () => {
    const provider = resolveProvider();
    expect(provider.name).toBe("ollama");
  });

  it("resolves to anthropic when selected and a key is present", () => {
    process.env.AI_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const provider = resolveProvider();
    expect(provider.name).toBe("anthropic");
  });

  it("fails fast, not falls back to ollama, when anthropic is selected with no key", () => {
    process.env.AI_PROVIDER = "anthropic";
    expect(() => resolveProvider()).toThrow(LlmConfigurationError);
    expect(() => resolveProvider()).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("throws LlmConfigurationError for an unrecognized AI_PROVIDER value", () => {
    process.env.AI_PROVIDER = "chatgpt-5-turbo-max";
    expect(() => resolveProvider()).toThrow(LlmConfigurationError);
    expect(() => resolveProvider()).toThrow(/Unknown AI_PROVIDER/);
  });
});
