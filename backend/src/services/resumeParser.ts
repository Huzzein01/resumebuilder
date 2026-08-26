import { randomUUID } from "node:crypto";
import type {
  ProfileDraft,
  ContactInfo,
  WorkExperience,
  ProjectEntry,
  VolunteerWork,
  Skill,
  Education,
  Certification,
  Bullet,
} from "@resumebuilder/shared";

const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_REGEX = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const LOCATION_REGEX = /\b[A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+)*,\s*[A-Z]{2}\b/;

const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
const DATE_RANGE_REGEX = new RegExp(
  `(?:(?:${MONTHS})[a-z]*\\.?\\s+)?(\\d{4})\\s*(?:[-–—]|to)\\s*(?:(?:${MONTHS})[a-z]*\\.?\\s+)?(\\d{4}|present|current)`,
  "i"
);

const BULLET_PREFIX_REGEX = /^[•\-*‣▪]\s*/;

type SectionName = "experience" | "education" | "skills" | "projects" | "certifications" | "volunteer" | "summary";

const SECTION_HEADERS: { section: SectionName; regex: RegExp }[] = [
  { section: "experience", regex: /^(work\s+)?(experience|employment(\s+history)?|professional\s+experience)$/i },
  { section: "education", regex: /^education$/i },
  { section: "skills", regex: /^(technical\s+)?skills$/i },
  { section: "projects", regex: /^projects?$/i },
  { section: "certifications", regex: /^(certifications?|licenses?)$/i },
  { section: "volunteer", regex: /^volunteer(ing)?(\s+(work|experience))?$/i },
  { section: "summary", regex: /^(summary|objective|profile|about( me)?)$/i },
];

// Headers we recognize but deliberately don't capture (no matching Profile section) —
// still reset the "current section" so their content doesn't get misfiled into
// whatever section preceded them.
const IGNORED_HEADERS = /^(references|interests|hobbies|awards|publications|languages)$/i;

function detectSectionHeader(line: string): SectionName | "ignore" | undefined {
  const cleaned = line.replace(/:$/, "").trim();
  if (cleaned.length > 40) return undefined;
  if (IGNORED_HEADERS.test(cleaned)) return "ignore";
  for (const { section, regex } of SECTION_HEADERS) {
    if (regex.test(cleaned)) return section;
  }
  return undefined;
}

function groupIntoSections(lines: string[]): Map<SectionName, string[]> {
  const sections = new Map<SectionName, string[]>();
  let current: SectionName | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    // Blank lines carry no reliable signal: PDF text extraction often drops them
    // between entries, while DOCX extraction (mammoth) inserts one after *every*
    // paragraph — so entry boundaries below are detected from line content, not
    // blank-line spacing.
    if (!line) continue;

    const header = detectSectionHeader(line);
    if (header === "ignore") {
      current = null;
      continue;
    }
    if (header) {
      current = header;
      if (!sections.has(header)) sections.set(header, []);
      continue;
    }

    if (current) sections.get(current)!.push(line);
  }

  return sections;
}

interface RawEntry {
  headerLine: string;
  dateRange: { start?: string; end?: string };
  bodyLines: string[];
}

function splitIntoEntries(lines: string[]): RawEntry[] {
  const entries: RawEntry[] = [];
  let current: RawEntry | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // A bullet-prefixed line is always a continuation of the current entry, never a
    // new one — this is checked before the date/header logic below.
    if (BULLET_PREFIX_REGEX.test(line)) {
      const bulletText = line.replace(BULLET_PREFIX_REGEX, "").trim();
      if (current) current.bodyLines.push(bulletText);
      else current = { headerLine: "", dateRange: {}, bodyLines: [bulletText] };
      continue;
    }

    const dateMatch = DATE_RANGE_REGEX.exec(line);
    if (dateMatch) {
      const withoutDate = line
        .replace(DATE_RANGE_REGEX, "")
        .replace(/[-–—,|]+$/, "")
        .trim();
      const dateRange = {
        start: dateMatch[1],
        end: /present|current/i.test(dateMatch[2]) ? undefined : dateMatch[2],
      };

      // Common two-line layout ("Title, Company" then a separate date-only line): fold
      // the date into the entry we just started rather than treating it as a new one.
      if (current && !current.dateRange.start && current.bodyLines.length === 0) {
        current.dateRange = dateRange;
        if (withoutDate) current.headerLine = `${current.headerLine} ${withoutDate}`.trim();
        continue;
      }

      if (current) entries.push(current);
      current = { headerLine: withoutDate, dateRange, bodyLines: [] };
      continue;
    }

    // A plain line that's neither a bullet nor a date: if an entry is already
    // underway, this can only be a new entry's title (an entry doesn't gain a second
    // title line) — never blank-line-dependent, since blank lines aren't reliable
    // across PDF/DOCX extraction (see groupIntoSections).
    if (current) entries.push(current);
    current = { headerLine: line, dateRange: {}, bodyLines: [] };
  }

  if (current) entries.push(current);
  return entries.filter((e) => e.headerLine || e.bodyLines.length > 0);
}

function splitHeader(headerLine: string): [string, string] {
  const atMatch = headerLine.match(/^(.*?)\s+at\s+(.*)$/i);
  if (atMatch) return [atMatch[1].trim(), atMatch[2].trim()];
  const commaIndex = headerLine.indexOf(",");
  if (commaIndex !== -1) return [headerLine.slice(0, commaIndex).trim(), headerLine.slice(commaIndex + 1).trim()];
  return [headerLine.trim(), ""];
}

function toBullets(bodyLines: string[]): Bullet[] {
  return bodyLines.filter(Boolean).map((text) => ({ id: randomUUID(), text }));
}

function buildWorkExperience(entries: RawEntry[]): WorkExperience[] {
  return entries.map((entry) => {
    const [title, company] = splitHeader(entry.headerLine);
    return {
      id: randomUUID(),
      title,
      company,
      startDate: entry.dateRange.start ?? "",
      endDate: entry.dateRange.end,
      bullets: toBullets(entry.bodyLines),
    };
  });
}

function buildVolunteerWork(entries: RawEntry[]): VolunteerWork[] {
  return entries.map((entry) => {
    const [role, organization] = splitHeader(entry.headerLine);
    return {
      id: randomUUID(),
      role,
      organization,
      startDate: entry.dateRange.start ?? "",
      endDate: entry.dateRange.end,
      bullets: toBullets(entry.bodyLines),
    };
  });
}

function buildProjects(entries: RawEntry[]): ProjectEntry[] {
  return entries.map((entry) => ({
    id: randomUUID(),
    name: entry.headerLine,
    startDate: entry.dateRange.start,
    endDate: entry.dateRange.end,
    techStack: [],
    bullets: toBullets(entry.bodyLines),
  }));
}

function buildEducation(entries: RawEntry[]): Education[] {
  return entries.map((entry) => {
    const [degree, school] = splitHeader(entry.headerLine);
    return {
      id: randomUUID(),
      school: school || degree,
      degree: school ? degree : "",
      field: "",
      startDate: entry.dateRange.start,
      endDate: entry.dateRange.end,
    };
  });
}

function buildSkills(lines: string[]): Skill[] {
  const tokens = lines
    .flatMap((line) => line.split(","))
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 40);
  return [...new Set(tokens)].map((name) => ({ id: randomUUID(), name, category: "", aliases: [] }));
}

function buildCertifications(lines: string[]): Certification[] {
  return lines.filter(Boolean).map((name) => ({ id: randomUUID(), name, issuer: "" }));
}

function extractContact(rawText: string): ContactInfo {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const emailMatch = EMAIL_REGEX.exec(rawText);
  const phoneMatch = PHONE_REGEX.exec(rawText);
  const firstLine = lines[0];
  const name = firstLine && firstLine.length < 60 && !EMAIL_REGEX.test(firstLine) ? firstLine : "";
  const locationMatch = lines.slice(0, 6).map((l) => LOCATION_REGEX.exec(l)).find((m): m is RegExpExecArray => !!m);

  return {
    name,
    email: emailMatch?.[0] ?? "",
    phone: phoneMatch?.[0] ?? "",
    location: locationMatch?.[0] ?? "",
    links: [],
  };
}

export function parseResumeText(rawText: string): ProfileDraft {
  const contact = extractContact(rawText);
  const lines = rawText.split(/\r?\n/);
  const sections = groupIntoSections(lines);

  return {
    contact,
    summary: (sections.get("summary") ?? []).filter(Boolean).join(" "),
    workExperience: buildWorkExperience(splitIntoEntries(sections.get("experience") ?? [])),
    projects: buildProjects(splitIntoEntries(sections.get("projects") ?? [])),
    volunteerWork: buildVolunteerWork(splitIntoEntries(sections.get("volunteer") ?? [])),
    skills: buildSkills(sections.get("skills") ?? []),
    education: buildEducation(splitIntoEntries(sections.get("education") ?? [])),
    certifications: buildCertifications(sections.get("certifications") ?? []),
  };
}
