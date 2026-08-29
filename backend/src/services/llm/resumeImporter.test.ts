import { describe, expect, it, vi } from "vitest";
import { importProfileWithLlm } from "./resumeImporter.js";
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
  return { name, isConfigured: () => configured, activeModel: () => `${name}-model`, complete: vi.fn(complete) };
}

describe("importProfileWithLlm", () => {
  it("returns a validated draft and the name of the provider that produced it", async () => {
    const provider = mockProvider("anthropic", async () => VALID_JSON);

    const result = await importProfileWithLlm("some resume text", provider);

    expect(result.providerName).toBe("anthropic");
    expect(result.draft.contact.name).toBe("Alex Kim");
    expect(result.draft.skills[0].name).toBe("Rust");
  });

  it("propagates the error when the provider returns malformed JSON", async () => {
    const broken = mockProvider("broken", async () => "not json");

    await expect(importProfileWithLlm("resume text", broken)).rejects.toThrow();
  });

  it("reports the provider and model that produced the result", async () => {
    const provider = mockProvider("ollama", async () => VALID_JSON);

    const result = await importProfileWithLlm("resume text", provider);

    expect(result.providerName).toBe("ollama");
    expect(result.model).toBe("ollama-model");
  });

  it("passes the (sanitized) resume text into the provider's prompt", async () => {
    const provider = mockProvider("anthropic", async () => VALID_JSON);

    await importProfileWithLlm("Jane Doe\nSoftware Engineer", provider);

    expect(provider.complete).toHaveBeenCalledWith(
      expect.objectContaining({ userPrompt: expect.stringContaining("Jane Doe") })
    );
  });
});
