import { skillTaxonomy } from "./skillTaxonomy.js";
import { buildSkillRegex, resolveTaxonomySkillId } from "./skillMatcher.js";
import type { Profile, SkillValidationFinding, SkillValidationResult } from "./types.js";

interface TextChunk {
  text: string;
  source: string;
}

function collectTextChunks(profile: Profile): TextChunk[] {
  const chunks: TextChunk[] = [];

  if (profile.summary.trim()) chunks.push({ text: profile.summary, source: "your summary" });

  for (const entry of profile.workExperience) {
    for (const bullet of entry.bullets) {
      chunks.push({ text: bullet.text, source: `"${entry.title}" at ${entry.company}` });
    }
  }

  for (const project of profile.projects) {
    if (project.techStack.length > 0) {
      chunks.push({ text: project.techStack.join(", "), source: `the "${project.name}" project's tech stack` });
    }
    for (const bullet of project.bullets) {
      chunks.push({ text: bullet.text, source: `the "${project.name}" project` });
    }
  }

  for (const vol of profile.volunteerWork) {
    for (const bullet of vol.bullets) {
      chunks.push({ text: bullet.text, source: `"${vol.role}" at ${vol.organization}` });
    }
  }

  for (const cert of profile.certifications) {
    chunks.push({ text: cert.name, source: "your certifications" });
  }

  return chunks;
}

export function validateSkills(profile: Profile): SkillValidationResult {
  const chunks = collectTextChunks(profile);
  const findings: SkillValidationFinding[] = [];

  for (const skill of profile.skills) {
    const taxonomyId = resolveTaxonomySkillId(skill.name);
    if (!taxonomyId) continue;
    const entry = skillTaxonomy.find((e) => e.id === taxonomyId)!;
    const regex = buildSkillRegex([entry.name, ...entry.aliases]);
    const evidenced = chunks.some((c) => regex.test(c.text));
    if (!evidenced) {
      findings.push({
        id: `unsubstantiated-${skill.id}`,
        type: "unsubstantiated",
        skillName: skill.name,
        message: `"${skill.name}" is listed as a skill but doesn't appear anywhere in your experience, projects, volunteer work, or summary — consider adding an example or removing it.`,
      });
    }
  }

  const listedTaxonomyIds = new Set(
    profile.skills.map((s) => resolveTaxonomySkillId(s.name)).filter((id): id is string => !!id)
  );
  for (const entry of skillTaxonomy) {
    if (listedTaxonomyIds.has(entry.id)) continue;
    const regex = buildSkillRegex([entry.name, ...entry.aliases]);
    const match = chunks.find((c) => regex.test(c.text));
    if (match) {
      findings.push({
        id: `missing-${entry.id}`,
        type: "missing-from-skills",
        skillName: entry.name,
        message: `"${entry.name}" is mentioned in ${match.source} but isn't listed in your Skills section — consider adding it.`,
      });
    }
  }

  return { findings };
}
