import { describe, expect, it } from "vitest";
import { parseLlmProfileDraft } from "./schemas.js";

const VALID_RESPONSE = JSON.stringify({
  contact: { name: "Jane Doe", email: "jane@example.com", phone: "", location: "Austin, TX", links: [] },
  summary: "Backend engineer.",
  workExperience: [
    {
      title: "Software Engineer",
      company: "Acme Corp",
      startDate: "Jan 2022",
      endDate: "Present",
      bullets: ["Built a payments service", "Reduced latency by 30%"],
    },
  ],
  projects: [],
  volunteerWork: [],
  skills: [{ name: "TypeScript", category: "Languages" }],
  education: [],
  certifications: [],
});

describe("parseLlmProfileDraft", () => {
  it("parses a valid response into a ProfileDraft with generated ids", () => {
    const draft = parseLlmProfileDraft(VALID_RESPONSE);

    expect(draft.contact.name).toBe("Jane Doe");
    expect(draft.workExperience).toHaveLength(1);
    expect(draft.workExperience[0].id).toEqual(expect.any(String));
    expect(draft.workExperience[0].bullets).toHaveLength(2);
    expect(draft.workExperience[0].bullets[0].id).toEqual(expect.any(String));
    expect(draft.workExperience[0].bullets[0].text).toBe("Built a payments service");
    expect(draft.skills[0]).toMatchObject({ name: "TypeScript", category: "Languages", aliases: [] });
  });

  it("assigns distinct ids to every entry, not one shared id", () => {
    const draft = parseLlmProfileDraft(VALID_RESPONSE);
    const ids = [draft.workExperience[0].id, draft.workExperience[0].bullets[0].id, draft.workExperience[0].bullets[1].id];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fills in missing optional arrays/fields with defaults instead of failing", () => {
    const minimal = JSON.stringify({ skills: [{ name: "Go" }] });
    const draft = parseLlmProfileDraft(minimal);

    expect(draft.contact).toEqual({ name: "", email: "", phone: "", location: "", links: [] });
    expect(draft.summary).toBe("");
    expect(draft.workExperience).toEqual([]);
    expect(draft.skills[0].name).toBe("Go");
    expect(draft.skills[0].category).toBe("");
  });

  it("drops skills and certifications with an empty name rather than keeping blank entries", () => {
    const withBlankSkill = JSON.stringify({
      skills: [{ name: "" }, { name: "Python" }],
      certifications: [{ name: "  " }, { name: "AWS Certified" }],
    });
    const draft = parseLlmProfileDraft(withBlankSkill);

    expect(draft.skills.map((s) => s.name)).toEqual(["Python"]);
    expect(draft.certifications.map((c) => c.name)).toEqual(["AWS Certified"]);
  });

  it("drops empty-string bullets rather than creating blank bullet entries", () => {
    const withBlankBullet = JSON.stringify({
      workExperience: [
        { title: "Eng", company: "Co", startDate: "2020", bullets: ["Did a thing", "  ", ""] },
      ],
    });
    const draft = parseLlmProfileDraft(withBlankBullet);

    expect(draft.workExperience[0].bullets).toHaveLength(1);
    expect(draft.workExperience[0].bullets[0].text).toBe("Did a thing");
  });

  it("throws on invalid JSON rather than returning a partial/garbage draft", () => {
    expect(() => parseLlmProfileDraft("not json at all")).toThrow(/not valid JSON/);
  });

  it("throws when a required field is the wrong type (schema violation)", () => {
    const badShape = JSON.stringify({ skills: [{ name: 12345 }] });
    expect(() => parseLlmProfileDraft(badShape)).toThrow();
  });

  it("throws when the top-level response isn't an object", () => {
    expect(() => parseLlmProfileDraft(JSON.stringify(["not", "an", "object"]))).toThrow();
  });
});
