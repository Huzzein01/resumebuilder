import { skillTaxonomy } from "./skillTaxonomy.js";
import type {
  Profile,
  Skill,
  WorkExperience,
  ProjectEntry,
  ExtractedRequirements,
  MatchedSkill,
  SkillScore,
  SkillMatchType,
  BulletScore,
  WorkExperienceScore,
  ProjectScore,
  RelevanceResult,
} from "./types.js";
import { buildSkillRegex, resolveTaxonomySkillId } from "./skillMatcher.js";

const taxonomyById = new Map(skillTaxonomy.map((entry) => [entry.id, entry]));
const normalize = (s: string) => s.trim().toLowerCase();

function termsForMatchedSkill(skill: MatchedSkill): string[] {
  const entry = taxonomyById.get(skill.skillId);
  return entry ? [entry.name, ...entry.aliases] : [skill.name];
}

function collectTaxonomyIds(skill: Skill): string[] {
  const ids = new Set<string>();
  const nameId = resolveTaxonomySkillId(skill.name);
  if (nameId) ids.add(nameId);
  for (const alias of skill.aliases) {
    const id = resolveTaxonomySkillId(alias);
    if (id) ids.add(id);
  }
  return [...ids];
}

function buildSkillScore(skill: Skill, score: number, matchType: SkillMatchType): SkillScore {
  return { skillId: skill.id, name: skill.name, category: skill.category, score, matchType };
}

function scoreSkill(
  skill: Skill,
  mustMap: Map<string, MatchedSkill>,
  niceMap: Map<string, MatchedSkill>,
  keywordSet: Set<string>
): SkillScore {
  const candidateIds = collectTaxonomyIds(skill);
  for (const id of candidateIds) {
    if (mustMap.has(id)) return buildSkillScore(skill, 100, "must-have");
  }
  for (const id of candidateIds) {
    if (niceMap.has(id)) return buildSkillScore(skill, 70, "nice-to-have");
  }
  if (keywordSet.has(normalize(skill.name))) return buildSkillScore(skill, 50, "keyword");
  return buildSkillScore(skill, 0, "none");
}

function scoreBulletText(
  text: string,
  requirements: ExtractedRequirements
): { score: number; matchedKeywords: string[] } {
  const { mustHaveSkills, niceToHaveSkills } = requirements;
  const totalWeight = 2 * mustHaveSkills.length + niceToHaveSkills.length;
  if (totalWeight === 0) return { score: 0, matchedKeywords: [] };

  let matchedWeight = 0;
  const matched: string[] = [];

  for (const skill of mustHaveSkills) {
    if (buildSkillRegex(termsForMatchedSkill(skill)).test(text)) {
      matchedWeight += 2;
      matched.push(skill.name);
    }
  }
  for (const skill of niceToHaveSkills) {
    if (buildSkillRegex(termsForMatchedSkill(skill)).test(text)) {
      matchedWeight += 1;
      matched.push(skill.name);
    }
  }

  return { score: Math.round((100 * matchedWeight) / totalWeight), matchedKeywords: matched };
}

function scoreWorkExperience(entry: WorkExperience, requirements: ExtractedRequirements): WorkExperienceScore {
  const bulletScores: BulletScore[] = entry.bullets.map((bullet) => {
    const { score, matchedKeywords } = scoreBulletText(bullet.text, requirements);
    return { bulletId: bullet.id, score, matchedKeywords };
  });
  const score = bulletScores.length
    ? Math.round(bulletScores.reduce((sum, b) => sum + b.score, 0) / bulletScores.length)
    : 0;
  return { id: entry.id, score, bulletScores };
}

function scoreProject(project: ProjectEntry, requirements: ExtractedRequirements): ProjectScore {
  const bulletScores: BulletScore[] = project.bullets.map((bullet) => {
    const { score, matchedKeywords } = scoreBulletText(bullet.text, requirements);
    return { bulletId: bullet.id, score, matchedKeywords };
  });
  const bestBulletScore = bulletScores.length ? Math.max(...bulletScores.map((b) => b.score)) : 0;

  const mustIds = new Set(requirements.mustHaveSkills.map((s) => s.skillId));
  const niceIds = new Set(requirements.niceToHaveSkills.map((s) => s.skillId));
  const totalWeight = 2 * mustIds.size + niceIds.size;

  const matchedTech: string[] = [];
  const seenIds = new Set<string>();
  let matchedWeight = 0;
  for (const tech of project.techStack) {
    const id = resolveTaxonomySkillId(tech);
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    if (mustIds.has(id)) {
      matchedWeight += 2;
      matchedTech.push(tech);
    } else if (niceIds.has(id)) {
      matchedWeight += 1;
      matchedTech.push(tech);
    }
  }
  const techOverlapScore = totalWeight === 0 ? 0 : Math.round((100 * matchedWeight) / totalWeight);
  const score = Math.round(0.6 * techOverlapScore + 0.4 * bestBulletScore);

  return { id: project.id, score, bulletScores, matchedTech };
}

function addPresentIdsFromText(text: string, requirements: ExtractedRequirements, presentIds: Set<string>) {
  for (const skill of [...requirements.mustHaveSkills, ...requirements.niceToHaveSkills]) {
    if (presentIds.has(skill.skillId)) continue;
    if (buildSkillRegex(termsForMatchedSkill(skill)).test(text)) presentIds.add(skill.skillId);
  }
}

export function scoreProfile(profile: Profile, requirements: ExtractedRequirements): RelevanceResult {
  const mustMap = new Map(requirements.mustHaveSkills.map((s) => [s.skillId, s]));
  const niceMap = new Map(requirements.niceToHaveSkills.map((s) => [s.skillId, s]));
  const keywordSet = new Set(requirements.keywords.map(normalize));

  const skillScores = profile.skills.map((skill) => scoreSkill(skill, mustMap, niceMap, keywordSet));
  const workExperienceScores = profile.workExperience.map((entry) => scoreWorkExperience(entry, requirements));
  const projectScores = profile.projects.map((project) => scoreProject(project, requirements));

  const presentIds = new Set<string>();
  for (const skill of profile.skills) {
    for (const id of collectTaxonomyIds(skill)) presentIds.add(id);
  }
  for (const entry of profile.workExperience) {
    for (const bullet of entry.bullets) addPresentIdsFromText(bullet.text, requirements, presentIds);
  }
  for (const project of profile.projects) {
    for (const tech of project.techStack) {
      const id = resolveTaxonomySkillId(tech);
      if (id) presentIds.add(id);
    }
    for (const bullet of project.bullets) addPresentIdsFromText(bullet.text, requirements, presentIds);
  }

  const matchedMustHave = requirements.mustHaveSkills.filter((s) => presentIds.has(s.skillId)).map((s) => s.name);
  const missingMustHave = requirements.mustHaveSkills.filter((s) => !presentIds.has(s.skillId)).map((s) => s.name);
  const matchedNiceToHave = requirements.niceToHaveSkills.filter((s) => presentIds.has(s.skillId)).map((s) => s.name);
  const missingNiceToHave = requirements.niceToHaveSkills
    .filter((s) => !presentIds.has(s.skillId))
    .map((s) => s.name);

  const mustHaveCoverage = requirements.mustHaveSkills.length
    ? Math.round((100 * matchedMustHave.length) / requirements.mustHaveSkills.length)
    : 0;
  const niceToHaveCoverage = requirements.niceToHaveSkills.length
    ? Math.round((100 * matchedNiceToHave.length) / requirements.niceToHaveSkills.length)
    : 0;
  const overallScore = Math.round(0.7 * mustHaveCoverage + 0.3 * niceToHaveCoverage);

  return {
    overallScore,
    mustHaveCoverage,
    niceToHaveCoverage,
    matchedMustHave,
    missingMustHave,
    matchedNiceToHave,
    missingNiceToHave,
    skillScores,
    workExperienceScores,
    projectScores,
  };
}
