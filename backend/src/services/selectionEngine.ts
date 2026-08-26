import type {
  Profile,
  Bullet,
  RelevanceResult,
  BulletScore,
  ItemSelection,
  WorkExperienceSelection,
  ProjectSelection,
  SelectionState,
} from "@resumebuilder/shared";

const SKILLS_TOP_N = 12;
const PROJECTS_TOP_N = 3;

function orderBulletsByScore(bullets: Bullet[], bulletScores: BulletScore[]): ItemSelection[] {
  const scoreByBulletId = new Map(bulletScores.map((b) => [b.bulletId, b.score]));
  return [...bullets]
    .sort((a, b) => (scoreByBulletId.get(b.id) ?? 0) - (scoreByBulletId.get(a.id) ?? 0))
    .map((bullet) => ({ id: bullet.id, selected: true }));
}

export function computeDefaultSelection(
  profile: Profile,
  relevance: RelevanceResult,
  jobDescriptionId: string
): SelectionState {
  const skillScoreById = new Map(relevance.skillScores.map((s) => [s.skillId, s.score]));
  const orderedSkills = [...profile.skills].sort(
    (a, b) => (skillScoreById.get(b.id) ?? 0) - (skillScoreById.get(a.id) ?? 0)
  );
  const topSkillIds = new Set(
    orderedSkills
      .filter((s) => (skillScoreById.get(s.id) ?? 0) > 0)
      .slice(0, SKILLS_TOP_N)
      .map((s) => s.id)
  );
  const skills: ItemSelection[] = orderedSkills.map((s) => ({
    id: s.id,
    selected: topSkillIds.has(s.id),
  }));

  const projectScoreById = new Map(relevance.projectScores.map((p) => [p.id, p]));
  const orderedProjects = [...profile.projects].sort(
    (a, b) => (projectScoreById.get(b.id)?.score ?? 0) - (projectScoreById.get(a.id)?.score ?? 0)
  );
  const topProjectIds = new Set(
    orderedProjects
      .filter((p) => (projectScoreById.get(p.id)?.score ?? 0) > 0)
      .slice(0, PROJECTS_TOP_N)
      .map((p) => p.id)
  );
  const projects: ProjectSelection[] = orderedProjects.map((project) => {
    const scoreEntry = projectScoreById.get(project.id);
    return {
      id: project.id,
      selected: topProjectIds.has(project.id),
      bullets: orderBulletsByScore(project.bullets, scoreEntry?.bulletScores ?? []),
    };
  });

  const workExpScoreById = new Map(relevance.workExperienceScores.map((w) => [w.id, w]));
  const workExperience: WorkExperienceSelection[] = profile.workExperience.map((entry) => {
    const scoreEntry = workExpScoreById.get(entry.id);
    return {
      id: entry.id,
      selected: true,
      bullets: orderBulletsByScore(entry.bullets, scoreEntry?.bulletScores ?? []),
    };
  });

  return { jobDescriptionId, workExperience, projects, skills };
}
