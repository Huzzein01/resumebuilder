import { describe, it, expect } from "vitest";
import type { Profile, ExtractedRequirements } from "@resumebuilder/shared";
import { scoreProfile } from "@resumebuilder/shared";
import { extractRequirements } from "./jdExtractor.js";
import { computeDefaultSelection } from "./selectionEngine.js";

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

describe("computeDefaultSelection — skills", () => {
  it("ranks skills by relevance score, descending, and auto-selects only positive-score skills", () => {
    const profile = emptyProfile();
    profile.skills = [
      { id: "s1", name: "Photoshop", category: "Design", aliases: [] }, // 0
      { id: "s2", name: "React", category: "Frontend", aliases: [] }, // 100
      { id: "s3", name: "Docker", category: "Cloud/DevOps", aliases: [] }, // 70
    ];
    const relevance = scoreProfile(profile, jd);
    const selection = computeDefaultSelection(profile, relevance, "jd1");

    expect(selection.skills.map((s) => s.id)).toEqual(["s2", "s3", "s1"]);
    expect(selection.skills.find((s) => s.id === "s2")?.selected).toBe(true);
    expect(selection.skills.find((s) => s.id === "s3")?.selected).toBe(true);
    expect(selection.skills.find((s) => s.id === "s1")?.selected).toBe(false);
  });

  it("only auto-selects the top 12 skills even if more have a positive score", () => {
    const profile = emptyProfile();
    // 15 skills that all resolve to the same must-have (React) via distinct profile ids
    // isn't realistic, so instead give each a unique matching JD skill by using a JD with many must-haves.
    const bigJd = extractRequirements(
      "Required: " +
        ["React", "TypeScript", "Node.js", "Python", "Java", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "SQL", "C#", "C++"].join(
          ", "
        )
    );
    profile.skills = [
      { id: "s1", name: "React", category: "Frontend", aliases: [] },
      { id: "s2", name: "TypeScript", category: "Languages", aliases: [] },
      { id: "s3", name: "Node.js", category: "Backend", aliases: [] },
      { id: "s4", name: "Python", category: "Languages", aliases: [] },
      { id: "s5", name: "Java", category: "Languages", aliases: [] },
      { id: "s6", name: "Go", category: "Languages", aliases: [] },
      { id: "s7", name: "Rust", category: "Languages", aliases: [] },
      { id: "s8", name: "Ruby", category: "Languages", aliases: [] },
      { id: "s9", name: "PHP", category: "Languages", aliases: [] },
      { id: "s10", name: "Swift", category: "Languages", aliases: [] },
      { id: "s11", name: "Kotlin", category: "Languages", aliases: [] },
      { id: "s12", name: "Scala", category: "Languages", aliases: [] },
      { id: "s13", name: "SQL", category: "Languages", aliases: [] },
      { id: "s14", name: "C#", category: "Languages", aliases: [] },
      { id: "s15", name: "C++", category: "Languages", aliases: [] },
    ];
    const relevance = scoreProfile(profile, bigJd);
    const selection = computeDefaultSelection(profile, relevance, "jd1");

    const selectedCount = selection.skills.filter((s) => s.selected).length;
    expect(selectedCount).toBe(12);
  });
});

describe("computeDefaultSelection — projects", () => {
  it("ranks projects by score and auto-selects only the top 3 with a positive score", () => {
    const profile = emptyProfile();
    profile.projects = [
      { id: "pr1", name: "Irrelevant", techStack: ["COBOL"], bullets: [] },
      { id: "pr2", name: "Relevant A", techStack: ["React", "TypeScript"], bullets: [] },
      { id: "pr3", name: "Relevant B", techStack: ["Node.js"], bullets: [] },
      { id: "pr4", name: "Relevant C", techStack: ["Docker"], bullets: [] },
      { id: "pr5", name: "Relevant D", techStack: ["React"], bullets: [] },
    ];
    const relevance = scoreProfile(profile, jd);
    const selection = computeDefaultSelection(profile, relevance, "jd1");

    expect(selection.projects[0].id).toBe("pr2"); // highest score: 2 must-have techs
    expect(selection.projects.at(-1)?.id).toBe("pr1"); // 0 score, sorted last
    const selectedIds = selection.projects.filter((p) => p.selected).map((p) => p.id);
    expect(selectedIds).toHaveLength(3);
    expect(selectedIds).not.toContain("pr1");
  });

  it("orders a project's bullets by relevance score without deselecting any", () => {
    const profile = emptyProfile();
    profile.projects = [
      {
        id: "pr1",
        name: "P",
        techStack: [],
        bullets: [
          { id: "b1", text: "Irrelevant bullet about nothing" },
          { id: "b2", text: "Built with React and TypeScript" },
        ],
      },
    ];
    const relevance = scoreProfile(profile, jd);
    const selection = computeDefaultSelection(profile, relevance, "jd1");

    expect(selection.projects[0].bullets.map((b) => b.id)).toEqual(["b2", "b1"]);
    expect(selection.projects[0].bullets.every((b) => b.selected)).toBe(true);
  });
});

describe("computeDefaultSelection — work experience", () => {
  it("keeps all work experience entries selected and in original order, reordering only bullets", () => {
    const profile = emptyProfile();
    profile.workExperience = [
      {
        id: "w1",
        title: "Older Role",
        company: "OldCo",
        startDate: "2015",
        endDate: "2018",
        bullets: [
          { id: "b1", text: "Nothing relevant" },
          { id: "b2", text: "Worked with React and Node.js" },
        ],
      },
      {
        id: "w2",
        title: "Newer Role",
        company: "NewCo",
        startDate: "2019",
        bullets: [],
      },
    ];
    const relevance = scoreProfile(profile, jd);
    const selection = computeDefaultSelection(profile, relevance, "jd1");

    expect(selection.workExperience.map((w) => w.id)).toEqual(["w1", "w2"]);
    expect(selection.workExperience.every((w) => w.selected)).toBe(true);
    expect(selection.workExperience[0].bullets.map((b) => b.id)).toEqual(["b2", "b1"]);
    expect(selection.workExperience[0].bullets.every((b) => b.selected)).toBe(true);
  });
});

describe("computeDefaultSelection — edge cases", () => {
  it("produces a valid, non-crashing result for a JD with no extracted requirements", () => {
    const noSignalJd = extractRequirements("We are hiring a great teammate.");
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: [] }];
    profile.projects = [{ id: "pr1", name: "P", techStack: ["React"], bullets: [] }];
    const relevance = scoreProfile(profile, noSignalJd);
    const selection = computeDefaultSelection(profile, relevance, "jd1");

    expect(selection.skills).toHaveLength(1);
    expect(selection.skills[0].selected).toBe(false);
    expect(selection.projects[0].selected).toBe(false);
  });

  it("handles an empty profile without crashing", () => {
    const relevance = scoreProfile(emptyProfile(), jd);
    const selection = computeDefaultSelection(emptyProfile(), relevance, "jd1");
    expect(selection).toEqual({ jobDescriptionId: "jd1", workExperience: [], projects: [], skills: [] });
  });
});
