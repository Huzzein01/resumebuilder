import { describe, it, expect } from "vitest";
import type { Profile } from "@resumebuilder/shared";
import { validateSkills } from "@resumebuilder/shared";

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
    researchExperience: [],
    leadership: [],
    extraCurricular: [],
    associations: [],
    awardsAndHonors: [],
    conferencesPresentations: [],
    courses: [],
    patents: [],
    publications: [],
    publicationsAbstract: [],
    languages: [],
    hobbiesAndInterests: [],
    testScores: [],
    references: [],
  };
}

describe("validateSkills — unsubstantiated skills", () => {
  it("flags a taxonomy skill with no evidence anywhere in the profile", () => {
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: [] }];
    const result = validateSkills(profile);
    expect(result.findings.some((f) => f.type === "unsubstantiated" && f.skillName === "React")).toBe(true);
  });

  it("does not flag a skill evidenced in a work-experience bullet", () => {
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: [] }];
    profile.workExperience = [
      {
        id: "w1",
        title: "Engineer",
        company: "Acme",
        startDate: "2020",
        bullets: [{ id: "b1", text: "Built a React frontend" }],
      },
    ];
    const result = validateSkills(profile);
    expect(result.findings.some((f) => f.type === "unsubstantiated")).toBe(false);
  });

  it("counts evidence found only in the summary", () => {
    const profile = emptyProfile();
    profile.summary = "Experienced React developer.";
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: [] }];
    const result = validateSkills(profile);
    expect(result.findings.some((f) => f.type === "unsubstantiated")).toBe(false);
  });

  it("counts evidence found only in volunteer work", () => {
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: [] }];
    profile.volunteerWork = [
      {
        id: "v1",
        role: "Mentor",
        organization: "Code Club",
        startDate: "2021",
        bullets: [{ id: "b1", text: "Taught React to beginners" }],
      },
    ];
    const result = validateSkills(profile);
    expect(result.findings.some((f) => f.type === "unsubstantiated")).toBe(false);
  });

  it("never flags a skill outside the taxonomy either way", () => {
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "Underwater Basket Weaving", category: "", aliases: [] }];
    const result = validateSkills(profile);
    expect(result.findings).toHaveLength(0);
  });
});

describe("validateSkills — missing from skills", () => {
  it("flags a taxonomy skill mentioned in a project bullet but not listed", () => {
    const profile = emptyProfile();
    profile.projects = [
      {
        id: "pr1",
        name: "Side Project",
        techStack: [],
        bullets: [{ id: "b1", text: "Used Docker to containerize the app" }],
      },
    ];
    const result = validateSkills(profile);
    const finding = result.findings.find((f) => f.type === "missing-from-skills" && f.skillName === "Docker");
    expect(finding).toBeDefined();
    expect(finding?.message).toContain("Side Project");
  });

  it("does not flag a skill that is already listed", () => {
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "Docker", category: "Cloud/DevOps", aliases: [] }];
    profile.projects = [
      { id: "pr1", name: "Side Project", techStack: [], bullets: [{ id: "b1", text: "Used Docker" }] },
    ];
    const result = validateSkills(profile);
    expect(result.findings.some((f) => f.type === "missing-from-skills" && f.skillName === "Docker")).toBe(false);
  });

  it("matches via an alias mentioned in the profile's tech stack", () => {
    const profile = emptyProfile();
    profile.projects = [{ id: "pr1", name: "Side Project", techStack: ["K8s"], bullets: [] }];
    const result = validateSkills(profile);
    expect(result.findings.some((f) => f.type === "missing-from-skills" && f.skillName === "Kubernetes")).toBe(true);
  });
});

describe("validateSkills — robustness", () => {
  it("produces no findings for an empty profile", () => {
    const result = validateSkills(emptyProfile());
    expect(result.findings).toEqual([]);
  });
});
