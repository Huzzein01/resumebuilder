import { describe, expect, it } from "vitest";
import type { ExtractedRequirements } from "@resumebuilder/shared";
import { parseLlmJdAnalysis, mergeLlmJdAnalysis, type LlmJdAnalysis } from "./jdEnhanceSchema.js";

function emptyDeterministic(overrides: Partial<ExtractedRequirements> = {}): ExtractedRequirements {
  return {
    mustHaveSkills: [],
    niceToHaveSkills: [],
    keywords: [],
    seniority: { level: "unknown" },
    ...overrides,
  };
}

function emptyLlm(overrides: Partial<LlmJdAnalysis> = {}): LlmJdAnalysis {
  return { mustHaveSkills: [], niceToHaveSkills: [], ...overrides };
}

describe("parseLlmJdAnalysis", () => {
  it("parses a valid response", () => {
    const parsed = parseLlmJdAnalysis(
      JSON.stringify({ title: "Backend Engineer", seniorityLevel: "senior", mustHaveSkills: ["Go"], niceToHaveSkills: [] })
    );
    expect(parsed.title).toBe("Backend Engineer");
    expect(parsed.seniorityLevel).toBe("senior");
  });

  it("defaults missing skill arrays to empty rather than failing", () => {
    const parsed = parseLlmJdAnalysis(JSON.stringify({}));
    expect(parsed.mustHaveSkills).toEqual([]);
    expect(parsed.niceToHaveSkills).toEqual([]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseLlmJdAnalysis("not json")).toThrow(/not valid JSON/);
  });

  it("throws on a seniority level outside the enum", () => {
    expect(() => parseLlmJdAnalysis(JSON.stringify({ seniorityLevel: "ceo" }))).toThrow();
  });
});

describe("mergeLlmJdAnalysis", () => {
  it("adds an LLM-found skill that resolves to a taxonomy entry the deterministic pass missed", () => {
    const { requirements, additionalSkillsDetected } = mergeLlmJdAnalysis(
      emptyDeterministic(),
      emptyLlm({ mustHaveSkills: ["React"] })
    );

    expect(requirements.mustHaveSkills).toEqual([
      { skillId: "react", name: "React", category: "Frontend", matchedText: "React" },
    ]);
    expect(additionalSkillsDetected).toEqual([]);
  });

  it("resolves a phrasing that isn't an exact alias match via substring matching", () => {
    const { requirements } = mergeLlmJdAnalysis(emptyDeterministic(), emptyLlm({ mustHaveSkills: ["React JS framework"] }));
    expect(requirements.mustHaveSkills).toEqual([
      { skillId: "react", name: "React", category: "Frontend", matchedText: "React JS framework" },
    ]);
  });

  it("does not duplicate a skill the deterministic pass already found", () => {
    const deterministic = emptyDeterministic({
      mustHaveSkills: [{ skillId: "react", name: "React", category: "Frontend", matchedText: "React" }],
    });
    const { requirements } = mergeLlmJdAnalysis(deterministic, emptyLlm({ mustHaveSkills: ["React"] }));

    expect(requirements.mustHaveSkills).toHaveLength(1);
  });

  it("never re-classifies a skill the deterministic pass already placed, even if the LLM disagrees on must-have vs nice-to-have", () => {
    const deterministic = emptyDeterministic({
      niceToHaveSkills: [{ skillId: "docker", name: "Docker", category: "Cloud/DevOps", matchedText: "Docker" }],
    });
    const { requirements } = mergeLlmJdAnalysis(deterministic, emptyLlm({ mustHaveSkills: ["Docker"] }));

    expect(requirements.mustHaveSkills).toEqual([]);
    expect(requirements.niceToHaveSkills).toHaveLength(1);
  });

  it("surfaces a skill with no taxonomy match as additionalSkillsDetected instead of dropping or fabricating an id", () => {
    const { requirements, additionalSkillsDetected } = mergeLlmJdAnalysis(
      emptyDeterministic(),
      emptyLlm({ mustHaveSkills: ["Zylotronics"] })
    );

    expect(requirements.mustHaveSkills).toEqual([]);
    expect(additionalSkillsDetected).toEqual(["Zylotronics"]);
  });

  it("dedupes additionalSkillsDetected", () => {
    const { additionalSkillsDetected } = mergeLlmJdAnalysis(
      emptyDeterministic(),
      emptyLlm({ mustHaveSkills: ["Zylotronics"], niceToHaveSkills: ["Zylotronics"] })
    );
    expect(additionalSkillsDetected).toEqual(["Zylotronics"]);
  });

  it("fills in seniority from the LLM only when the deterministic pass found nothing", () => {
    const { requirements } = mergeLlmJdAnalysis(emptyDeterministic(), emptyLlm({ seniorityLevel: "senior" }));
    expect(requirements.seniority.level).toBe("senior");
  });

  it("keeps the deterministic seniority level even when the LLM disagrees", () => {
    const deterministic = emptyDeterministic({ seniority: { level: "mid" } });
    const { requirements } = mergeLlmJdAnalysis(deterministic, emptyLlm({ seniorityLevel: "senior" }));
    expect(requirements.seniority.level).toBe("mid");
  });

  it("fills in yearsRequired from the LLM when the deterministic pass didn't find a number", () => {
    const deterministic = emptyDeterministic({ seniority: { level: "mid" } });
    const { requirements } = mergeLlmJdAnalysis(deterministic, emptyLlm({ yearsRequired: 5 }));
    expect(requirements.seniority.yearsRequired).toBe(5);
  });

  it("fills in title from the LLM only when the deterministic pass found none", () => {
    const { requirements } = mergeLlmJdAnalysis(emptyDeterministic(), emptyLlm({ title: "Staff Engineer" }));
    expect(requirements.title).toBe("Staff Engineer");
  });

  it("keeps the deterministic title even when the LLM disagrees", () => {
    const deterministic = emptyDeterministic({ title: "Software Engineer II" });
    const { requirements } = mergeLlmJdAnalysis(deterministic, emptyLlm({ title: "Staff Engineer" }));
    expect(requirements.title).toBe("Software Engineer II");
  });

  it("recomputes keywords from the merged skill lists", () => {
    const deterministic = emptyDeterministic({
      mustHaveSkills: [{ skillId: "nodejs", name: "Node.js", category: "Backend", matchedText: "Node.js" }],
    });
    const { requirements } = mergeLlmJdAnalysis(deterministic, emptyLlm({ niceToHaveSkills: ["Kubernetes"] }));
    expect(requirements.keywords.sort()).toEqual(["Kubernetes", "Node.js"]);
  });
});
