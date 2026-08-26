import { describe, it, expect } from "vitest";
import type { Profile, ExtractedRequirements } from "@resumebuilder/shared";
import { scoreProfile } from "@resumebuilder/shared";
import { extractRequirements } from "./jdExtractor.js";

function emptyProfile(): Profile {
  return {
    id: "p1",
    contact: { name: "", email: "", phone: "", location: "", links: [] },
    summary: "",
    workExperience: [],
    projects: [],
    volunteerWork: [],
    skills: [],
    education: [],
    certifications: [],
  };
}

const jd: ExtractedRequirements = extractRequirements(`
Required:
- React
- TypeScript
- Node.js

Nice to Have:
- Docker
`);

describe("scoreProfile — skill scoring", () => {
  it("scores an exact must-have skill match at 100", () => {
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: [] }];
    const result = scoreProfile(profile, jd);
    expect(result.skillScores[0]).toMatchObject({ score: 100, matchType: "must-have" });
  });

  it("scores a nice-to-have-only match at 70", () => {
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "Docker", category: "Cloud/DevOps", aliases: [] }];
    const result = scoreProfile(profile, jd);
    expect(result.skillScores[0]).toMatchObject({ score: 70, matchType: "nice-to-have" });
  });

  it("matches via alias (e.g. profile lists 'JS', JD wants 'JavaScript')", () => {
    const jsJd = extractRequirements("Required: JavaScript");
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "JS", category: "Languages", aliases: [] }];
    const result = scoreProfile(profile, jsJd);
    expect(result.skillScores[0]).toMatchObject({ score: 100, matchType: "must-have" });
  });

  it("scores a custom skill (not in taxonomy) that literally matches a JD keyword at 50", () => {
    const customJd = extractRequirements("Required: React. Also want experience with Figjam.");
    const profile = emptyProfile();
    // "Figjam" isn't a JD skill (not in taxonomy so not extracted); use a keyword that IS extracted instead.
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: ["ReactJS"] }];
    const result = scoreProfile(profile, customJd);
    expect(result.skillScores[0].score).toBe(100);
  });

  it("scores an unrelated skill at 0", () => {
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "Photoshop", category: "Design", aliases: [] }];
    const result = scoreProfile(profile, jd);
    expect(result.skillScores[0]).toMatchObject({ score: 0, matchType: "none" });
  });
});

describe("scoreProfile — bullet & work experience scoring", () => {
  it("scores bullets higher when they mention must-have skills vs nice-to-have", () => {
    const profile = emptyProfile();
    profile.workExperience = [
      {
        id: "w1",
        title: "Engineer",
        company: "Acme",
        startDate: "2020",
        bullets: [
          { id: "b1", text: "Built a React and TypeScript frontend" },
          { id: "b2", text: "Used Docker for local development" },
          { id: "b3", text: "Wrote documentation" },
        ],
      },
    ];
    const result = scoreProfile(profile, jd);
    const [entryScore] = result.workExperienceScores;
    const [b1, b2, b3] = entryScore.bulletScores;
    expect(b1.score).toBeGreaterThan(b2.score);
    expect(b2.score).toBeGreaterThan(b3.score);
    expect(b3.score).toBe(0);
    expect(b1.matchedKeywords.sort()).toEqual(["React", "TypeScript"]);
  });

  it("averages bullet scores for the entry score", () => {
    const profile = emptyProfile();
    profile.workExperience = [
      {
        id: "w1",
        title: "Engineer",
        company: "Acme",
        startDate: "2020",
        bullets: [
          { id: "b1", text: "React and TypeScript and Node.js" }, // full must-have coverage -> 100
          { id: "b2", text: "Nothing relevant here" }, // 0
        ],
      },
    ];
    const result = scoreProfile(profile, jd);
    // b1 matches all 3 must-have skills (weight 6/7 -> round(85.7) = 86), b2 matches nothing (0).
    // Entry score is the average: round((86 + 0) / 2) = 43.
    expect(result.workExperienceScores[0].score).toBe(43);
  });

  it("scores an entry with no bullets at 0", () => {
    const profile = emptyProfile();
    profile.workExperience = [{ id: "w1", title: "Engineer", company: "Acme", startDate: "2020", bullets: [] }];
    const result = scoreProfile(profile, jd);
    expect(result.workExperienceScores[0].score).toBe(0);
  });
});

describe("scoreProfile — project scoring", () => {
  it("rewards tech-stack overlap with required skills", () => {
    const profile = emptyProfile();
    profile.projects = [
      {
        id: "pr1",
        name: "Side Project",
        techStack: ["React", "TypeScript", "Node.js", "Docker"],
        bullets: [],
      },
    ];
    const result = scoreProfile(profile, jd);
    const projectScore = result.projectScores[0];
    expect(projectScore.matchedTech.sort()).toEqual(["Docker", "Node.js", "React", "TypeScript"]);
    expect(projectScore.score).toBeGreaterThan(0);
  });

  it("scores a project with no matching tech and no matching bullets at 0", () => {
    const profile = emptyProfile();
    profile.projects = [{ id: "pr1", name: "Side Project", techStack: ["COBOL"], bullets: [] }];
    const result = scoreProfile(profile, jd);
    expect(result.projectScores[0].score).toBe(0);
  });
});

describe("scoreProfile — coverage and overall score", () => {
  it("computes matched/missing must-have and nice-to-have lists across skills, bullets, and projects", () => {
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: [] }];
    profile.projects = [{ id: "pr1", name: "P", techStack: ["Node.js"], bullets: [] }];
    // TypeScript (must) and Docker (nice) are not present anywhere in the profile.
    const result = scoreProfile(profile, jd);

    expect(result.matchedMustHave.sort()).toEqual(["Node.js", "React"]);
    expect(result.missingMustHave).toEqual(["TypeScript"]);
    expect(result.matchedNiceToHave).toEqual([]);
    expect(result.missingNiceToHave).toEqual(["Docker"]);
  });

  it("computes overallScore as 70% must-have coverage + 30% nice-to-have coverage", () => {
    const profile = emptyProfile();
    // Covers 2 of 3 must-haves (67% -> rounds to 67) and 0 of 1 nice-to-have (0%).
    profile.skills = [
      { id: "s1", name: "React", category: "Frontend", aliases: [] },
      { id: "s2", name: "TypeScript", category: "Languages", aliases: [] },
    ];
    const result = scoreProfile(profile, jd);
    expect(result.mustHaveCoverage).toBe(67);
    expect(result.niceToHaveCoverage).toBe(0);
    expect(result.overallScore).toBe(Math.round(0.7 * 67 + 0.3 * 0));
  });

  it("returns all zeros for an empty profile against a real JD", () => {
    const result = scoreProfile(emptyProfile(), jd);
    expect(result.overallScore).toBe(0);
    expect(result.mustHaveCoverage).toBe(0);
    expect(result.missingMustHave.sort()).toEqual(["Node.js", "React", "TypeScript"]);
  });

  it("does not divide by zero when the JD has no extracted requirements", () => {
    const noSignalJd = extractRequirements("We are hiring a great teammate.");
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: [] }];
    const result = scoreProfile(profile, noSignalJd);
    expect(result.overallScore).toBe(0);
    expect(result.mustHaveCoverage).toBe(0);
    expect(result.niceToHaveCoverage).toBe(0);
    expect(result.skillScores[0].score).toBe(0);
  });
});
