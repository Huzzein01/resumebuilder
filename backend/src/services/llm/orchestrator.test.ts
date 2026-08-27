import { describe, expect, it, vi } from "vitest";
import { completeWithFailover } from "./orchestrator.js";
import { LlmUnavailableError } from "./types.js";
import type { LlmProvider } from "./types.js";

function mockProvider(name: string, opts: { configured?: boolean; result?: string; error?: Error } = {}): LlmProvider {
  return {
    name,
    isConfigured: () => opts.configured ?? true,
    complete: vi.fn(async () => {
      if (opts.error) throw opts.error;
      return opts.result ?? "{}";
    }),
  };
}

const REQUEST = { systemPrompt: "sys", userPrompt: "user", maxOutputTokens: 100 };
const identity = (raw: string) => raw;

describe("completeWithFailover", () => {
  it("uses the first configured provider that succeeds", async () => {
    const first = mockProvider("first", { result: "first-response" });
    const second = mockProvider("second", { result: "second-response" });

    const result = await completeWithFailover([first, second], REQUEST, identity);

    expect(result).toEqual({ result: "first-response", providerName: "first" });
    expect(second.complete).not.toHaveBeenCalled();
  });

  it("skips providers that aren't configured", async () => {
    const unconfigured = mockProvider("unconfigured", { configured: false });
    const configured = mockProvider("configured", { result: "ok" });

    const result = await completeWithFailover([unconfigured, configured], REQUEST, identity);

    expect(result.providerName).toBe("configured");
    expect(unconfigured.complete).not.toHaveBeenCalled();
  });

  it("falls back to the next provider when the first fails", async () => {
    const failing = mockProvider("failing", { error: new Error("rate limited") });
    const working = mockProvider("working", { result: "recovered" });

    const result = await completeWithFailover([failing, working], REQUEST, identity);

    expect(result).toEqual({ result: "recovered", providerName: "working" });
  });

  it("falls back to the next provider when parseResponse rejects the first provider's output", async () => {
    const badOutput = mockProvider("bad-output", { result: "not-json" });
    const goodOutput = mockProvider("good-output", { result: "valid" });
    const parse = (raw: string) => {
      if (raw !== "valid") throw new Error("failed to parse");
      return raw;
    };

    const result = await completeWithFailover([badOutput, goodOutput], REQUEST, parse);

    expect(result).toEqual({ result: "valid", providerName: "good-output" });
  });

  it("throws LlmUnavailableError when no provider is configured", async () => {
    const unconfigured = mockProvider("unconfigured", { configured: false });

    await expect(completeWithFailover([unconfigured], REQUEST, identity)).rejects.toThrow(LlmUnavailableError);
  });

  it("throws LlmUnavailableError, naming every provider, when all configured providers fail", async () => {
    const a = mockProvider("a", { error: new Error("boom-a") });
    const b = mockProvider("b", { error: new Error("boom-b") });

    await expect(completeWithFailover([a, b], REQUEST, identity)).rejects.toThrow(/a: boom-a.*b: boom-b/s);
  });

  it("throws LlmUnavailableError, naming every provider, when all responses fail parseResponse", async () => {
    const a = mockProvider("a", { result: "bad" });
    const b = mockProvider("b", { result: "also-bad" });
    const parse = () => {
      throw new Error("nope");
    };

    await expect(completeWithFailover([a, b], REQUEST, parse)).rejects.toThrow(/a: nope.*b: nope/s);
  });
});
