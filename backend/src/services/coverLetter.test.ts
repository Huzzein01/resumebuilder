import { describe, it, expect } from "vitest";
import type { Profile, JobDescription, SelectionState } from "@resumebuilder/shared";
import { scoreProfile, buildCoverLetter } from "@resumebuilder/shared";
import { extractRequirements } from "./jdExtractor.js";

function emptyProfile(): Profile {
  return {
    id: "p1",
    contact: { name: "Jane Doe", email: "jane@example.com", phone: "", location: "", links: [] },
    summary: "",
    workExperience: [],
    projects: [],
    volunteerWork: [],
    skills: [],
    education: [],
    certifications: [],
  };
}

function jobDescriptionFrom(rawText: string): JobDescription {
  return {
    id: "jd1",
    rawText,
    createdAt: new Date().toISOString(),
    requirements: extractRequirements(rawText),
  };
}

function fullySelected(profile: Profile): SelectionState {
  return {
    jobDescriptionId: "jd1",
    workExperience: profile.workExperience.map((w) => ({
      id: w.id,
      selected: true,
      bullets: w.bullets.map((b) => ({ id: b.id, selected: true })),
    })),
    projects: profile.projects.map((p) => ({
      id: p.id,
      selected: true,
      bullets: p.bullets.map((b) => ({ id: b.id, selected: true })),
    })),
    skills: profile.skills.map((s) => ({ id: s.id, selected: true })),
  };
}

describe("buildCoverLetter", () => {
  it("names the extracted job title and company in the opening paragraph", () => {
    const jd = jobDescriptionFrom("Senior Frontend Engineer\n\nRequired:\n- React");
    const profile = emptyProfile();
    const selection = fullySelected(profile);
    const relevance = scoreProfile(profile, jd.requirements);
    const letter = buildCoverLetter(profile, jd, relevance, selection, { companyName: "Acme Corp" });

    expect(letter.openingParagraph).toContain("Senior Frontend Engineer");
    expect(letter.openingParagraph).toContain("Acme Corp");
    expect(letter.jobTitle).toBe("Senior Frontend Engineer");
  });

  it("falls back to generic phrasing when no job title or company is available", () => {
    const jd = jobDescriptionFrom("We are hiring a great engineer to join our team.");
    const profile = emptyProfile();
    const selection = fullySelected(profile);
    const relevance = scoreProfile(profile, jd.requirements);
    const letter = buildCoverLetter(profile, jd, relevance, selection);

    expect(letter.openingParagraph).toContain("this position");
    expect(letter.jobTitle).toBeUndefined();
  });

  it("mentions matched must-have skills in the opening paragraph", () => {
    const jd = jobDescriptionFrom("Engineer\n\nRequired:\n- React\n- TypeScript");
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: [] }];
    const selection = fullySelected(profile);
    const relevance = scoreProfile(profile, jd.requirements);
    const letter = buildCoverLetter(profile, jd, relevance, selection);

    expect(letter.openingParagraph).toContain("React");
  });

  it("references the highest-scoring selected bullet in the body paragraph", () => {
    const jd = jobDescriptionFrom("Engineer\n\nRequired:\n- React\n- TypeScript");
    const profile = emptyProfile();
    profile.workExperience = [
      {
        id: "w1",
        title: "Software Engineer",
        company: "Acme",
        startDate: "2020",
        bullets: [
          { id: "b1", text: "Wrote internal documentation" },
          { id: "b2", text: "Built a React and TypeScript frontend that increased conversion by 15%" },
        ],
      },
    ];
    const selection = fullySelected(profile);
    const relevance = scoreProfile(profile, jd.requirements);
    const letter = buildCoverLetter(profile, jd, relevance, selection);

    expect(letter.bodyParagraph).toContain("Software Engineer");
    expect(letter.bodyParagraph).toContain("Acme");
    expect(letter.bodyParagraph.toLowerCase()).toContain("built a react and typescript frontend");
  });

  it("ignores unselected bullets when picking the body paragraph highlight", () => {
    const jd = jobDescriptionFrom("Engineer\n\nRequired:\n- React");
    const profile = emptyProfile();
    profile.workExperience = [
      {
        id: "w1",
        title: "Software Engineer",
        company: "Acme",
        startDate: "2020",
        bullets: [{ id: "b1", text: "Built a React app used by thousands of customers" }],
      },
    ];
    const selection = fullySelected(profile);
    // Deselect the only bullet -> no selected content to highlight.
    selection.workExperience[0].bullets[0].selected = false;
    const relevance = scoreProfile(profile, jd.requirements);
    const letter = buildCoverLetter(profile, jd, relevance, selection);

    expect(letter.bodyParagraph).not.toContain("Acme");
    expect(letter.bodyParagraph.length).toBeGreaterThan(0);
  });

  it("passes through contact info from the profile", () => {
    const jd = jobDescriptionFrom("Engineer");
    const profile = emptyProfile();
    const selection = fullySelected(profile);
    const relevance = scoreProfile(profile, jd.requirements);
    const letter = buildCoverLetter(profile, jd, relevance, selection);

    expect(letter.contact.name).toBe("Jane Doe");
  });
});
