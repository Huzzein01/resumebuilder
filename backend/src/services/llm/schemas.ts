import { randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  ProfileDraft,
  WorkExperience,
  ProjectEntry,
  VolunteerWork,
  Skill,
  Education,
  Certification,
  Bullet,
} from "@resumebuilder/shared";

// The LLM never invents ids -- it only returns content. randomUUID() below
// assigns them afterward, the same convention resumeParser.ts (the
// deterministic path) already uses, so a resume imported either way looks
// identical to the rest of the app.

const linkSchema = z.object({
  label: z.string().default(""),
  url: z.string().default(""),
});

const contactSchema = z.object({
  name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  links: z.array(linkSchema).default([]),
});

const bulletsSchema = z.array(z.string()).default([]);

const workExperienceSchema = z.object({
  title: z.string().default(""),
  company: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().optional(),
  bullets: bulletsSchema,
});

const projectSchema = z.object({
  name: z.string().default(""),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  bullets: bulletsSchema,
});

const volunteerWorkSchema = z.object({
  role: z.string().default(""),
  organization: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().optional(),
  bullets: bulletsSchema,
});

const skillSchema = z.object({
  name: z.string(),
  category: z.string().default(""),
});

const educationSchema = z.object({
  school: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().default(""),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const certificationSchema = z.object({
  name: z.string(),
  issuer: z.string().default(""),
  date: z.string().optional(),
});

export const llmProfileDraftSchema = z.object({
  contact: contactSchema.default({ name: "", email: "", phone: "", location: "", links: [] }),
  summary: z.string().default(""),
  workExperience: z.array(workExperienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  volunteerWork: z.array(volunteerWorkSchema).default([]),
  skills: z.array(skillSchema).default([]),
  education: z.array(educationSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
});

export type LlmProfileDraft = z.infer<typeof llmProfileDraftSchema>;

function toBullets(texts: string[]): Bullet[] {
  return texts.filter((t) => t.trim().length > 0).map((text) => ({ id: randomUUID(), text }));
}

/** Assigns ids and converts the model's validated, id-free shape into a real ProfileDraft. */
export function toProfileDraft(parsed: LlmProfileDraft): ProfileDraft {
  const workExperience: WorkExperience[] = parsed.workExperience.map((entry) => ({
    id: randomUUID(),
    title: entry.title,
    company: entry.company,
    startDate: entry.startDate,
    endDate: entry.endDate,
    bullets: toBullets(entry.bullets),
  }));

  const projects: ProjectEntry[] = parsed.projects.map((entry) => ({
    id: randomUUID(),
    name: entry.name,
    startDate: entry.startDate,
    endDate: entry.endDate,
    techStack: entry.techStack,
    bullets: toBullets(entry.bullets),
  }));

  const volunteerWork: VolunteerWork[] = parsed.volunteerWork.map((entry) => ({
    id: randomUUID(),
    role: entry.role,
    organization: entry.organization,
    startDate: entry.startDate,
    endDate: entry.endDate,
    bullets: toBullets(entry.bullets),
  }));

  const skills: Skill[] = parsed.skills
    .filter((s) => s.name.trim().length > 0)
    .map((s) => ({ id: randomUUID(), name: s.name, category: s.category, aliases: [] }));

  const education: Education[] = parsed.education.map((entry) => ({
    id: randomUUID(),
    school: entry.school,
    degree: entry.degree,
    field: entry.field,
    startDate: entry.startDate,
    endDate: entry.endDate,
  }));

  const certifications: Certification[] = parsed.certifications
    .filter((c) => c.name.trim().length > 0)
    .map((c) => ({ id: randomUUID(), name: c.name, issuer: c.issuer, date: c.date }));

  return {
    contact: parsed.contact,
    summary: parsed.summary,
    workExperience,
    projects,
    volunteerWork,
    skills,
    education,
    certifications,
  };
}

/**
 * Parses and validates a raw model response. Throws on anything that isn't
 * valid JSON matching the schema -- callers must treat that as a failure and
 * fall back to the deterministic parser, never pass an unvalidated shape
 * into the rest of the app.
 */
export function parseLlmProfileDraft(raw: string): ProfileDraft {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    const parseError = new Error(
      `LLM response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`
    );
    throw parseError;
  }
  const parsed = llmProfileDraftSchema.parse(json);
  return toProfileDraft(parsed);
}
