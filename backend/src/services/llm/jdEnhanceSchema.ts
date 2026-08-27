import { z } from "zod";
import { skillTaxonomy, buildSkillRegex, type ExtractedRequirements, type SeniorityLevel } from "@resumebuilder/shared";

const SENIORITY_LEVELS: SeniorityLevel[] = [
  "intern",
  "entry",
  "mid",
  "senior",
  "staff",
  "principal",
  "lead",
  "unknown",
];

export const llmJdAnalysisSchema = z.object({
  title: z.string().optional(),
  seniorityLevel: z.enum(SENIORITY_LEVELS as [SeniorityLevel, ...SeniorityLevel[]]).optional(),
  yearsRequired: z.number().optional(),
  mustHaveSkills: z.array(z.string()).default([]),
  niceToHaveSkills: z.array(z.string()).default([]),
});

export type LlmJdAnalysis = z.infer<typeof llmJdAnalysisSchema>;

export function parseLlmJdAnalysis(raw: string): LlmJdAnalysis {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    throw new Error(`LLM response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  return llmJdAnalysisSchema.parse(json);
}

/**
 * Same substring/word-boundary matching the deterministic extractor already
 * uses per taxonomy entry (buildSkillRegex), not resolveTaxonomySkillId's
 * exact-match lookup -- an LLM's phrasing of a skill name ("React JS",
 * "Node") won't always be an exact registered alias, but it will usually
 * still contain one as a substring, and this is far more permissive without
 * giving up correctness (still a real taxonomy entry, still a real skillId
 * the rest of scoring already understands).
 *
 * More than one entry can legitimately match the same phrase -- e.g. "React
 * JS framework" contains both React's name and JavaScript's "JS" alias as
 * valid word-boundary matches. Picking the first taxonomy-array hit here
 * would arbitrarily resolve to whichever entry happens to be declared
 * earlier; instead this keeps the *longest* actual match, treating a more
 * specific/complete hit ("React", 5 chars) as more likely correct than an
 * incidental short one ("JS", 2 chars) -- the same "more specific wins"
 * reasoning buildSkillRegex already applies when sorting alternation terms
 * within a single entry's own name/aliases.
 */
function resolveToTaxonomyEntry(skillName: string) {
  let best: { entry: (typeof skillTaxonomy)[number]; matchLength: number } | undefined;
  for (const entry of skillTaxonomy) {
    const match = buildSkillRegex([entry.name, ...entry.aliases]).exec(skillName);
    if (!match) continue;
    const matchLength = match[1].length;
    if (!best || matchLength > best.matchLength) best = { entry, matchLength };
  }
  return best?.entry;
}

export interface MergedRequirements {
  requirements: ExtractedRequirements;
  additionalSkillsDetected: string[];
}

/**
 * Merges the LLM's analysis into the deterministic result -- an enhancement
 * layer, not a replacement. Every skillId in the merged mustHaveSkills/
 * niceToHaveSkills is still guaranteed to be a real taxonomy id (so
 * relevanceEngine.ts's existing skillId-keyed scoring needs no changes at
 * all); an LLM-identified skill that isn't in the taxonomy can't
 * participate in scoring without one, so it's surfaced separately as
 * informational-only rather than silently dropped or given a fabricated id.
 */
export function mergeLlmJdAnalysis(
  deterministic: ExtractedRequirements,
  llm: LlmJdAnalysis
): MergedRequirements {
  const mustHaveSkills = [...deterministic.mustHaveSkills];
  const niceToHaveSkills = [...deterministic.niceToHaveSkills];
  const knownIds = new Set([...mustHaveSkills, ...niceToHaveSkills].map((s) => s.skillId));
  const additionalSkillsDetected: string[] = [];

  function addSkill(name: string, target: typeof mustHaveSkills) {
    const entry = resolveToTaxonomyEntry(name);
    if (!entry) {
      additionalSkillsDetected.push(name);
      return;
    }
    if (knownIds.has(entry.id)) return; // already found by the deterministic pass (in either list)
    knownIds.add(entry.id);
    target.push({ skillId: entry.id, name: entry.name, category: entry.category, matchedText: name });
  }

  for (const name of llm.mustHaveSkills) addSkill(name, mustHaveSkills);
  for (const name of llm.niceToHaveSkills) addSkill(name, niceToHaveSkills);

  const keywords = [...new Set([...mustHaveSkills, ...niceToHaveSkills].map((s) => s.name))];

  // The LLM's seniority/title only fill gaps the deterministic pass left
  // open -- a confident deterministic result (a known level, an extracted
  // title) is never silently overridden.
  const seniority =
    deterministic.seniority.level === "unknown" && llm.seniorityLevel
      ? { level: llm.seniorityLevel, yearsRequired: deterministic.seniority.yearsRequired ?? llm.yearsRequired }
      : { ...deterministic.seniority, yearsRequired: deterministic.seniority.yearsRequired ?? llm.yearsRequired };

  const title = deterministic.title ?? llm.title;

  return {
    requirements: { mustHaveSkills, niceToHaveSkills, keywords, seniority, title },
    additionalSkillsDetected: [...new Set(additionalSkillsDetected)],
  };
}
