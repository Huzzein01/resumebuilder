export const RESUME_TEMPLATE_IDS = ["single-column", "modern-sidebar"] as const;
export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];

export const DEFAULT_RESUME_TEMPLATE_ID: ResumeTemplateId = "single-column";

export interface ResumeTemplateMeta {
  id: ResumeTemplateId;
  name: string;
  description: string;
}

export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  {
    id: "single-column",
    name: "Classic",
    description: "Single-column, serif -- the safest choice for ATS parsing.",
  },
  {
    id: "modern-sidebar",
    name: "Modern",
    description: "Two-column with a colored sidebar for contact, skills, and education.",
  },
];

export function isResumeTemplateId(value: unknown): value is ResumeTemplateId {
  return typeof value === "string" && (RESUME_TEMPLATE_IDS as readonly string[]).includes(value);
}
