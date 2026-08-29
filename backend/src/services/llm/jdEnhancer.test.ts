import { describe, expect, it, vi } from "vitest";
import type { ExtractedRequirements } from "@resumebuilder/shared";
import { enhanceRequirementsWithLlm } from "./jdEnhancer.js";
import type { LlmProvider } from "./types.js";

const DETERMINISTIC: ExtractedRequirements = {
  mustHaveSkills: [],
  niceToHaveSkills: [],
  keywords: [],
  seniority: { level: "unknown" },
};

const VALID_JSON = JSON.stringify({
  title: "Backend Engineer",
  seniorityLevel: "senior",
  mustHaveSkills: ["React"],
  niceToHaveSkills: ["Docker"],
});

function mockProvider(name: string, complete: LlmProvider["complete"], configured = true): LlmProvider {
  return { name, isConfigured: () => configured, activeModel: () => `${name}-model`, complete: vi.fn(complete) };
}

describe("enhanceRequirementsWithLlm", () => {
  it("merges the LLM's analysis into the deterministic requirements", async () => {
    const provider = mockProvider("anthropic", async () => VALID_JSON);

    const result = await enhanceRequirementsWithLlm("some JD text", DETERMINISTIC, provider);

    expect(result.providerName).toBe("anthropic");
    expect(result.requirements.mustHaveSkills.map((s) => s.name)).toEqual(["React"]);
    expect(result.requirements.niceToHaveSkills.map((s) => s.name)).toEqual(["Docker"]);
    expect(result.requirements.seniority.level).toBe("senior");
    expect(result.requirements.title).toBe("Backend Engineer");
  });

  it("propagates the error when the provider returns malformed JSON", async () => {
    const broken = mockProvider("broken", async () => "not json");

    await expect(enhanceRequirementsWithLlm("JD text", DETERMINISTIC, broken)).rejects.toThrow();
  });

  it("reports the provider and model that produced the result", async () => {
    const provider = mockProvider("ollama", async () => VALID_JSON);

    const result = await enhanceRequirementsWithLlm("JD text", DETERMINISTIC, provider);

    expect(result.providerName).toBe("ollama");
    expect(result.model).toBe("ollama-model");
  });

  it("does not touch a deterministic result that already found everything", async () => {
    const alreadyComplete: ExtractedRequirements = {
      mustHaveSkills: [{ skillId: "react", name: "React", category: "Frontend", matchedText: "React" }],
      niceToHaveSkills: [],
      keywords: ["React"],
      seniority: { level: "staff" },
      title: "Principal Engineer",
    };
    const provider = mockProvider("anthropic", async () => VALID_JSON);

    const result = await enhanceRequirementsWithLlm("JD text", alreadyComplete, provider);

    expect(result.requirements.seniority.level).toBe("staff");
    expect(result.requirements.title).toBe("Principal Engineer");
    expect(result.requirements.mustHaveSkills).toHaveLength(1);
  });
});
