export const RESUME_TEMPLATE_IDS = [
  "single-column",
  "minimal-sans",
  "modern-serif",
  "bold-header",
  "compact",
  "executive",
  "technical",
  "modern-sidebar",
] as const;
export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];

export const DEFAULT_RESUME_TEMPLATE_ID: ResumeTemplateId = "single-column";

export interface ResumeTemplateMeta {
  id: ResumeTemplateId;
  name: string;
  description: string;
  /** Single-column, no tables/graphics -- safe for ATS parsers. The two-column sidebar template is excluded since some older ATS parsers mis-order multi-column text. */
  atsFriendly: boolean;
}

export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  {
    id: "single-column",
    name: "Classic",
    description: "Single-column, serif -- the safest choice for ATS parsing.",
    atsFriendly: true,
  },
  {
    id: "minimal-sans",
    name: "Minimal",
    description: "Clean sans-serif, left-aligned, understated section dividers.",
    atsFriendly: true,
  },
  {
    id: "modern-serif",
    name: "Modern Serif",
    description: "A refined literary serif with a maroon accent.",
    atsFriendly: true,
  },
  {
    id: "bold-header",
    name: "Bold Header",
    description: "A colored band behind your name; the rest stays plain text for ATS parsing.",
    atsFriendly: true,
  },
  {
    id: "compact",
    name: "Compact",
    description: "Tighter spacing and smaller type to fit more onto one page.",
    atsFriendly: true,
  },
  {
    id: "executive",
    name: "Executive",
    description: "Formal Times New Roman with a traditional double-rule header.",
    atsFriendly: true,
  },
  {
    id: "technical",
    name: "Technical",
    description: "Monospace section headers -- a popular look for engineering resumes.",
    atsFriendly: true,
  },
  {
    id: "modern-sidebar",
    name: "Modern",
    description: "Two-column with a colored sidebar for contact, skills, and education.",
    atsFriendly: false,
  },
];

export function isResumeTemplateId(value: unknown): value is ResumeTemplateId {
  return typeof value === "string" && (RESUME_TEMPLATE_IDS as readonly string[]).includes(value);
}
