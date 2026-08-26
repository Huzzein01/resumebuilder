import { describe, it, expect } from "vitest";
import { extractRequirements } from "./jdExtractor.js";

describe("extractRequirements", () => {
  it("classifies skills under a 'Required' heading as must-have", () => {
    const jd = `
Required Qualifications:
- Strong experience with React and TypeScript
- Familiarity with Node.js
`;
    const result = extractRequirements(jd);
    const mustNames = result.mustHaveSkills.map((s) => s.name).sort();
    expect(mustNames).toEqual(["Node.js", "React", "TypeScript"]);
    expect(result.niceToHaveSkills).toHaveLength(0);
  });

  it("classifies skills under a 'Preferred' / 'Nice to have' heading as nice-to-have", () => {
    const jd = `
Requirements:
- Python

Nice to Have:
- Experience with Docker and Kubernetes
`;
    const result = extractRequirements(jd);
    expect(result.mustHaveSkills.map((s) => s.name)).toEqual(["Python"]);
    const niceNames = result.niceToHaveSkills.map((s) => s.name).sort();
    expect(niceNames).toEqual(["Docker", "Kubernetes"]);
  });

  it("matches aliases like JS -> JavaScript and K8s -> Kubernetes", () => {
    const jd = "Must have JS and K8s experience.";
    const result = extractRequirements(jd);
    const names = result.mustHaveSkills.map((s) => s.name).sort();
    expect(names).toEqual(["JavaScript", "Kubernetes"]);
  });

  it("matches special-character skill names like C++ and C#", () => {
    const jd = "Looking for a developer skilled in C++ and C#.";
    const result = extractRequirements(jd);
    const names = result.mustHaveSkills.map((s) => s.name).sort();
    expect(names).toEqual(["C#", "C++"]);
  });

  it("defaults unlabeled requirement lines to must-have", () => {
    const jd = "We need someone who knows Go and PostgreSQL.";
    const result = extractRequirements(jd);
    const names = result.mustHaveSkills.map((s) => s.name).sort();
    expect(names).toEqual(["Go", "PostgreSQL"]);
  });

  it("extracts years of experience", () => {
    const jd = "5+ years of experience in software engineering required.";
    const result = extractRequirements(jd);
    expect(result.seniority.yearsRequired).toBe(5);
  });

  it("detects seniority level keywords", () => {
    expect(extractRequirements("Senior Software Engineer").seniority.level).toBe("senior");
    expect(extractRequirements("Staff Engineer").seniority.level).toBe("staff");
    expect(extractRequirements("Entry level developer").seniority.level).toBe("entry");
    expect(extractRequirements("Summer internship").seniority.level).toBe("intern");
  });

  it("returns unknown seniority and empty results for a JD with no signals", () => {
    const result = extractRequirements("We are hiring a great teammate to join our mission.");
    expect(result.seniority.level).toBe("unknown");
    expect(result.mustHaveSkills).toHaveLength(0);
    expect(result.niceToHaveSkills).toHaveLength(0);
    expect(result.keywords).toHaveLength(0);
  });

  it("does not crash on empty input", () => {
    const result = extractRequirements("");
    expect(result.mustHaveSkills).toHaveLength(0);
    expect(result.keywords).toHaveLength(0);
  });

  it("keeps must-have as the winner when a skill appears in both sections", () => {
    const jd = `
Required:
- Python

Preferred:
- Python (advanced)
`;
    const result = extractRequirements(jd);
    expect(result.mustHaveSkills.map((s) => s.name)).toEqual(["Python"]);
    expect(result.niceToHaveSkills).toHaveLength(0);
  });

  it("extracts the job title from the first line", () => {
    const jd = "Senior Frontend Engineer\n\nRequired:\n- React";
    expect(extractRequirements(jd).title).toBe("Senior Frontend Engineer");
  });

  it("does not extract a title from a freeform sentence-style opening line", () => {
    const jd = "We are hiring a great engineer to join our growing team.";
    expect(extractRequirements(jd).title).toBeUndefined();
  });

  it("does not extract a title from a heading-like first line", () => {
    const jd = "Required Qualifications:\n- React";
    expect(extractRequirements(jd).title).toBeUndefined();
  });

  it("does not extract an overly long first line as a title", () => {
    const jd = "A".repeat(90) + "\nRequired:\n- React";
    expect(extractRequirements(jd).title).toBeUndefined();
  });
});
