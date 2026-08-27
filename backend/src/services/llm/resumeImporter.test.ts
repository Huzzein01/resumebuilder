import { describe, expect, it, vi } from "vitest";
import { importProfileWithLlm } from "./resumeImporter.js";
import { LlmUnavailableError } from "./types.js";
import type { LlmProvider } from "./types.js";

const VALID_JSON = JSON.stringify({
  contact: { name: "Alex Kim", email: "alex@example.com", phone: "", location: "", links: [] },
  summary: "",
  workExperience: [],
  projects: [],
  volunteerWork: [],
  skills: [{ name: "Rust", category: "" }],
  education: [],
  certifications: [],
});

function mockProvider(name: string, complete: LlmProvider["complete"], configured = true): LlmProvider {
  return { name, isConfigured: () => configured, complete: vi.fn(complete) };
}

describe("importProfileWithLlm", () => {
  it("returns a validated draft and the name of the provider that produced it", async () => {
    const provider = mockProvider("anthropic", async () => VALID_JSON);

    const result = await importProfileWithLlm("some resume text", [provider]);

    expect(result.providerName).toBe("anthropic");
    expect(result.draft.contact.name).toBe("Alex Kim");
    expect(result.draft.skills[0].name).toBe("Rust");
  });

  it("falls through to the next provider when the first returns malformed JSON", async () => {
    const broken = mockProvider("broken", async () => "not json");
    const working = mockProvider("working", async () => VALID_JSON);

    const result = await importProfileWithLlm("resume text", [broken, working]);

    expect(result.providerName).toBe("working");
    expect(result.draft.contact.name).toBe("Alex Kim");
  });

  it("propagates LlmUnavailableError when every provider returns malformed JSON", async () => {
    const brokenA = mockProvider("a", async () => "not json");
    const brokenB = mockProvider("b", async () => "{ malformed");

    await expect(importProfileWithLlm("resume text", [brokenA, brokenB])).rejects.toThrow(LlmUnavailableError);
  });

  it("propagates LlmUnavailableError when no provider is configured", async () => {
    const unconfigured = mockProvider("unconfigured", async () => VALID_JSON, false);

    await expect(importProfileWithLlm("resume text", [unconfigured])).rejects.toThrow(LlmUnavailableError);
  });

  it("passes the (sanitized) resume text into the provider's prompt", async () => {
    const provider = mockProvider("anthropic", async () => VALID_JSON);

    await importProfileWithLlm("Jane Doe\nSoftware Engineer", [provider]);

    expect(provider.complete).toHaveBeenCalledWith(
      expect.objectContaining({ userPrompt: expect.stringContaining("Jane Doe") })
    );
  });
});
