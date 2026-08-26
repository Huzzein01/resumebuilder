import { describe, it, expect } from "vitest";
import { parseResumeText } from "./resumeParser.js";

describe("parseResumeText — contact", () => {
  it("extracts name, email, and phone", () => {
    const text = `Jane Doe
jane@example.com | 555-123-4567 | New York, NY
`;
    const draft = parseResumeText(text);
    expect(draft.contact.name).toBe("Jane Doe");
    expect(draft.contact.email).toBe("jane@example.com");
    expect(draft.contact.phone).toBe("555-123-4567");
  });

  it("extracts a City, ST style location near the top", () => {
    const text = `Jane Doe
New York, NY
jane@example.com
`;
    const draft = parseResumeText(text);
    expect(draft.contact.location).toBe("New York, NY");
  });

  it("does not crash and returns blank contact fields for empty input", () => {
    const draft = parseResumeText("");
    expect(draft.contact.name).toBe("");
    expect(draft.contact.email).toBe("");
  });
});

describe("parseResumeText — experience", () => {
  it("splits two experience entries by date range and captures bullets", () => {
    const text = `Jane Doe

EXPERIENCE
Software Engineer, Acme Corp
2021 - 2024
- Built a React frontend
- Improved test coverage

Junior Developer, Startup Inc
2019 - 2021
- Wrote backend services
`;
    const draft = parseResumeText(text);
    expect(draft.workExperience).toHaveLength(2);

    const [first, second] = draft.workExperience;
    expect(first.title).toBe("Software Engineer");
    expect(first.company).toBe("Acme Corp");
    expect(first.startDate).toBe("2021");
    expect(first.endDate).toBe("2024");
    expect(first.bullets.map((b) => b.text)).toEqual(["Built a React frontend", "Improved test coverage"]);

    expect(second.title).toBe("Junior Developer");
    expect(second.company).toBe("Startup Inc");
  });

  it("handles a two-line 'title/company' then 'date-only' layout", () => {
    const text = `EXPERIENCE
Software Engineer, Acme Corp
Jan 2020 - Present
- Shipped features
`;
    const draft = parseResumeText(text);
    expect(draft.workExperience).toHaveLength(1);
    expect(draft.workExperience[0].title).toBe("Software Engineer");
    expect(draft.workExperience[0].company).toBe("Acme Corp");
    expect(draft.workExperience[0].startDate).toBe("2020");
    expect(draft.workExperience[0].endDate).toBeUndefined();
  });

  it("assigns a real id to every generated entry and bullet", () => {
    const text = `EXPERIENCE
Engineer, Acme
2020 - 2021
- Did a thing
`;
    const draft = parseResumeText(text);
    const entry = draft.workExperience[0];
    expect(entry.id).toBeTruthy();
    expect(entry.bullets[0].id).toBeTruthy();
    expect(entry.id).not.toBe(entry.bullets[0].id);
  });
});

describe("parseResumeText — education", () => {
  it("extracts a degree and school from an education entry", () => {
    const text = `EDUCATION
B.S. in Computer Science, State University
2015 - 2019
`;
    const draft = parseResumeText(text);
    expect(draft.education).toHaveLength(1);
    expect(draft.education[0].degree).toBe("B.S. in Computer Science");
    expect(draft.education[0].school).toBe("State University");
    expect(draft.education[0].startDate).toBe("2015");
    expect(draft.education[0].endDate).toBe("2019");
  });
});

describe("parseResumeText — skills and certifications", () => {
  it("splits a comma-separated skills line into individual skills", () => {
    const text = `SKILLS
React, TypeScript, Node.js
`;
    const draft = parseResumeText(text);
    const names = draft.skills.map((s) => s.name).sort();
    expect(names).toEqual(["Node.js", "React", "TypeScript"]);
    expect(draft.skills.every((s) => s.category === "")).toBe(true);
  });

  it("captures each certification line", () => {
    const text = `CERTIFICATIONS
AWS Certified Developer
Certified Scrum Master
`;
    const draft = parseResumeText(text);
    expect(draft.certifications.map((c) => c.name)).toEqual(["AWS Certified Developer", "Certified Scrum Master"]);
  });
});

describe("parseResumeText — robustness", () => {
  it("returns an empty-but-valid draft for garbage input", () => {
    const draft = parseResumeText("asdf 1234 !!! random noise\n\n\n---");
    expect(draft.workExperience).toEqual([]);
    expect(draft.education).toEqual([]);
    expect(draft.skills).toEqual([]);
    expect(draft.certifications).toEqual([]);
  });

  it("ignores a Summary/Objective section rather than misfiling it", () => {
    const text = `Jane Doe

SUMMARY
Experienced engineer with a passion for building things.

SKILLS
React
`;
    const draft = parseResumeText(text);
    expect(draft.skills.map((s) => s.name)).toEqual(["React"]);
  });
});
