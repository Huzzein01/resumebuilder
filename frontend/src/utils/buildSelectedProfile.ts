import type { Profile, SelectionState, WorkExperience, ProjectEntry, Bullet } from "@resumebuilder/shared";

function selectedBullets(bulletSelection: { id: string; selected: boolean }[], bulletById: Map<string, Bullet>): Bullet[] {
  return bulletSelection
    .filter((b) => b.selected)
    .map((b) => bulletById.get(b.id))
    .filter((b): b is Bullet => b !== undefined && b.text.trim().length > 0);
}

/**
 * Filters a Profile down to only what's currently selected (same content as
 * buildTailoredResume), but keeps the Profile shape intact — bullets stay {id, text}
 * objects rather than being flattened to strings — so it can be fed straight into
 * scoreProfile to compute the ATS score of what will actually be exported.
 */
export function buildSelectedProfile(profile: Profile, selection: SelectionState): Profile {
  const workExperienceById = new Map(profile.workExperience.map((w) => [w.id, w]));
  const workExperience: WorkExperience[] = selection.workExperience
    .filter((sel) => sel.selected)
    .map((sel) => {
      const entry = workExperienceById.get(sel.id)!;
      const bulletById = new Map(entry.bullets.map((b) => [b.id, b]));
      return { ...entry, bullets: selectedBullets(sel.bullets, bulletById) };
    });

  const projectById = new Map(profile.projects.map((p) => [p.id, p]));
  const projects: ProjectEntry[] = selection.projects
    .filter((sel) => sel.selected)
    .map((sel) => {
      const project = projectById.get(sel.id)!;
      const bulletById = new Map(project.bullets.map((b) => [b.id, b]));
      return { ...project, bullets: selectedBullets(sel.bullets, bulletById) };
    });

  const skillById = new Map(profile.skills.map((s) => [s.id, s]));
  const skills = selection.skills
    .filter((sel) => sel.selected)
    .map((sel) => skillById.get(sel.id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  return {
    ...profile,
    workExperience,
    projects,
    skills,
  };
}
