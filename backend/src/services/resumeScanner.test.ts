import { describe, it, expect } from "vitest";
import type { Profile } from "@resumebuilder/shared";
import { scanResume } from "@resumebuilder/shared";

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

describe("scanResume — bullet heuristics", () => {
  it("flags a bullet with no quantifiable metric", () => {
    const profile = emptyProfile();
    profile.workExperience = [
      { id: "w1", title: "Engineer", company: "Acme", startDate: "2020", bullets: [{ id: "b1", text: "Built a dashboard for customers" }] },
    ];
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.category === "no-metrics" && s.targetId === "b1")).toBe(true);
  });

  it("does not flag a bullet that has a metric", () => {
    const profile = emptyProfile();
    profile.workExperience = [
      { id: "w1", title: "Engineer", company: "Acme", startDate: "2020", bullets: [{ id: "b1", text: "Reduced load time by 40%" }] },
    ];
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.category === "no-metrics")).toBe(false);
  });

  it("flags a weak/passive opening phrase", () => {
    const profile = emptyProfile();
    profile.workExperience = [
      { id: "w1", title: "Engineer", company: "Acme", startDate: "2020", bullets: [{ id: "b1", text: "Responsible for managing a team of 5" }] },
    ];
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.category === "weak-opener" && s.targetId === "b1")).toBe(true);
  });

  it("flags first-person pronouns", () => {
    const profile = emptyProfile();
    profile.workExperience = [
      { id: "w1", title: "Engineer", company: "Acme", startDate: "2020", bullets: [{ id: "b1", text: "I led a project that saved 10 hours" }] },
    ];
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.category === "first-person" && s.targetId === "b1")).toBe(true);
  });

  it("flags an overly long bullet", () => {
    const profile = emptyProfile();
    const longText = "Led a cross-functional initiative that " + "significantly ".repeat(20) + "improved outcomes by 20%";
    profile.workExperience = [
      { id: "w1", title: "Engineer", company: "Acme", startDate: "2020", bullets: [{ id: "b1", text: longText }] },
    ];
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.category === "bullet-too-long")).toBe(true);
  });

  it("does not flag a clean, well-formed bullet", () => {
    const profile = emptyProfile();
    profile.workExperience = [
      { id: "w1", title: "Engineer", company: "Acme", startDate: "2020", bullets: [{ id: "b1", text: "Cut deployment time by 35% by automating the release pipeline" }] },
    ];
    const result = scanResume(profile);
    const relevant = result.suggestions.filter((s) => s.targetId === "b1");
    expect(relevant).toHaveLength(0);
  });
});

describe("scanResume — duplicate bullets", () => {
  it("flags a bullet reused verbatim across two entries", () => {
    const profile = emptyProfile();
    profile.workExperience = [
      { id: "w1", title: "Engineer", company: "Acme", startDate: "2020", bullets: [{ id: "b1", text: "Shipped 3 features that increased revenue by 10%" }] },
    ];
    profile.projects = [
      { id: "pr1", name: "Side Project", techStack: [], bullets: [{ id: "pb1", text: "shipped 3 features that increased revenue by 10%" }] },
    ];
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.category === "duplicate-bullet" && s.targetId === "pb1")).toBe(true);
  });

  it("does not flag distinct bullets", () => {
    const profile = emptyProfile();
    profile.workExperience = [
      { id: "w1", title: "Engineer", company: "Acme", startDate: "2020", bullets: [{ id: "b1", text: "Shipped 3 features that increased revenue by 10%" }] },
    ];
    profile.projects = [
      { id: "pr1", name: "Side Project", techStack: [], bullets: [{ id: "pb1", text: "Reduced build time by 25% using caching" }] },
    ];
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.category === "duplicate-bullet")).toBe(false);
  });
});

describe("scanResume — structural checks", () => {
  it("flags an empty work experience entry", () => {
    const profile = emptyProfile();
    profile.workExperience = [{ id: "w1", title: "Engineer", company: "Acme", startDate: "2020", bullets: [] }];
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.category === "empty-section" && s.targetId === "w1")).toBe(true);
  });

  it("flags an empty project", () => {
    const profile = emptyProfile();
    profile.projects = [{ id: "pr1", name: "Side Project", techStack: [], bullets: [] }];
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.category === "empty-section" && s.targetId === "pr1")).toBe(true);
  });

  it("flags a skill with no category", () => {
    const profile = emptyProfile();
    profile.skills = [{ id: "s1", name: "React", category: "", aliases: [] }];
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.category === "uncategorized-skill" && s.targetId === "s1")).toBe(true);
  });

  it("flags missing email as high severity", () => {
    const profile = emptyProfile();
    const result = scanResume(profile);
    const suggestion = result.suggestions.find((s) => s.category === "missing-contact" && s.id === "missing-email");
    expect(suggestion?.severity).toBe("high");
  });

  it("flags missing phone and location together", () => {
    const profile = emptyProfile();
    profile.contact.email = "jane@example.com";
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.id === "missing-phone-location")).toBe(true);
  });

  it("does not flag phone/location when at least one is present", () => {
    const profile = emptyProfile();
    profile.contact.email = "jane@example.com";
    profile.contact.location = "New York, NY";
    const result = scanResume(profile);
    expect(result.suggestions.some((s) => s.id === "missing-phone-location")).toBe(false);
  });
});

describe("scanResume — score", () => {
  it("scores a fully empty profile with all high-severity structural flags, clamped at 0 or above", () => {
    const result = scanResume(emptyProfile());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.suggestions.some((s) => s.id === "no-skills")).toBe(true);
    expect(result.suggestions.some((s) => s.id === "no-work-experience")).toBe(true);
    expect(result.suggestions.some((s) => s.id === "missing-email")).toBe(true);
  });

  it("scores a clean, complete profile at 100 with no suggestions", () => {
    const profile = emptyProfile();
    profile.contact.email = "jane@example.com";
    profile.contact.phone = "555-1234";
    profile.workExperience = [
      {
        id: "w1",
        title: "Engineer",
        company: "Acme",
        startDate: "2020",
        bullets: [{ id: "b1", text: "Cut deployment time by 35% by automating the release pipeline" }],
      },
    ];
    profile.skills = [{ id: "s1", name: "React", category: "Frontend", aliases: [] }];
    const result = scanResume(profile);
    expect(result.suggestions).toHaveLength(0);
    expect(result.score).toBe(100);
  });

  it("sorts suggestions with high severity first", () => {
    const result = scanResume(emptyProfile());
    const severities = result.suggestions.map((s) => s.severity);
    const firstMediumIndex = severities.indexOf("medium");
    const firstLowIndex = severities.indexOf("low");
    const lastHighIndex = severities.lastIndexOf("high");
    if (firstMediumIndex !== -1) expect(lastHighIndex).toBeLessThan(firstMediumIndex);
    if (firstLowIndex !== -1 && firstMediumIndex !== -1) expect(firstMediumIndex).toBeLessThan(firstLowIndex);
  });
});
