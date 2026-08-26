import {
  skillTaxonomy,
  buildSkillRegex,
  type ExtractedRequirements,
  type MatchedSkill,
  type SeniorityInfo,
  type SeniorityLevel,
} from "@resumebuilder/shared";

const MUST_HEADING = /required|must[\s-]?have|minimum\s+qualifications|requirements?:/i;
const NICE_HEADING = /preferred|nice[\s-]?to[\s-]?have|bonus|(?:a\s+)?plus\b/i;

type Section = "must" | "nice";

function tagSections(rawText: string): { text: string; section: Section }[] {
  const lines = rawText.split(/\r?\n/);
  const tagged: { text: string; section: Section }[] = [];
  let current: Section = "must";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isHeadingLine = trimmed.length < 80 && /:$|^[A-Z\s]+$/.test(trimmed.replace(/[^A-Za-z\s:]/g, ""));
    if (isHeadingLine && NICE_HEADING.test(trimmed)) {
      current = "nice";
      continue;
    }
    if (isHeadingLine && MUST_HEADING.test(trimmed)) {
      current = "must";
      continue;
    }

    if (NICE_HEADING.test(trimmed) && !MUST_HEADING.test(trimmed)) {
      tagged.push({ text: trimmed, section: "nice" });
    } else {
      tagged.push({ text: trimmed, section: current });
    }
  }

  return tagged;
}

function matchSkills(taggedLines: { text: string; section: Section }[]): {
  mustHaveSkills: MatchedSkill[];
  niceToHaveSkills: MatchedSkill[];
} {
  const mustMap = new Map<string, MatchedSkill>();
  const niceMap = new Map<string, MatchedSkill>();

  for (const entry of skillTaxonomy) {
    const regex = buildSkillRegex([entry.name, ...entry.aliases]);
    let foundInMust = false;
    let matchedText = "";

    for (const { text, section } of taggedLines) {
      const match = regex.exec(text);
      if (!match) continue;
      matchedText = match[1];
      if (section === "must") {
        foundInMust = true;
        break;
      } else if (!niceMap.has(entry.id)) {
        niceMap.set(entry.id, {
          skillId: entry.id,
          name: entry.name,
          category: entry.category,
          matchedText,
        });
      }
    }

    if (foundInMust) {
      niceMap.delete(entry.id);
      mustMap.set(entry.id, {
        skillId: entry.id,
        name: entry.name,
        category: entry.category,
        matchedText,
      });
    }
  }

  return { mustHaveSkills: [...mustMap.values()], niceToHaveSkills: [...niceMap.values()] };
}

const YEARS_REGEX = /(\d+)\+?\s*-?\s*(?:to\s*\d+\s*)?\+?\s*years?/i;

const SENIORITY_KEYWORDS: { level: SeniorityLevel; regex: RegExp }[] = [
  { level: "principal", regex: /\bprincipal\b/i },
  { level: "staff", regex: /\bstaff\b/i },
  { level: "lead", regex: /\blead\b/i },
  { level: "senior", regex: /\bsenior\b|\bsr\.?\b/i },
  { level: "mid", regex: /\bmid[\s-]?level\b/i },
  { level: "entry", regex: /\bentry[\s-]?level\b|\bjunior\b|\bjr\.?\b/i },
  { level: "intern", regex: /\bintern(ship)?\b/i },
];

function detectSeniority(rawText: string): SeniorityInfo {
  const yearsMatch = YEARS_REGEX.exec(rawText);
  const yearsRequired = yearsMatch ? Number(yearsMatch[1]) : undefined;

  for (const { level, regex } of SENIORITY_KEYWORDS) {
    if (regex.test(rawText)) {
      return { level, yearsRequired };
    }
  }

  return { level: "unknown", yearsRequired };
}

function extractTitle(rawText: string): string | undefined {
  const firstLine = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstLine) return undefined;
  if (firstLine.length > 80) return undefined;
  if (/[.:;]$/.test(firstLine)) return undefined;
  if (MUST_HEADING.test(firstLine) || NICE_HEADING.test(firstLine)) return undefined;
  return firstLine;
}

export function extractRequirements(rawText: string): ExtractedRequirements {
  const taggedLines = tagSections(rawText);
  const { mustHaveSkills, niceToHaveSkills } = matchSkills(taggedLines);
  const keywords = [...new Set([...mustHaveSkills, ...niceToHaveSkills].map((s) => s.name))];
  const seniority = detectSeniority(rawText);
  const title = extractTitle(rawText);

  return { mustHaveSkills, niceToHaveSkills, keywords, seniority, title };
}
