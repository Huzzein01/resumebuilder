import type { Profile, SelectionState, TailoredResume, TailoredWorkExperience, TailoredProject } from "./types.js";

function selectedBulletTexts(bulletSelection: { id: string; selected: boolean }[], bulletById: Map<string, string>): string[] {
  return bulletSelection
    .filter((b) => b.selected)
    .map((b) => bulletById.get(b.id) ?? "")
    .filter((text) => text.trim().length > 0);
}

export function buildTailoredResume(profile: Profile, selection: SelectionState): TailoredResume {
  const workExperienceById = new Map(profile.workExperience.map((w) => [w.id, w]));
  const workExperience: TailoredWorkExperience[] = selection.workExperience
    .filter((sel) => sel.selected)
    .map((sel) => {
      const entry = workExperienceById.get(sel.id)!;
      const bulletById = new Map(entry.bullets.map((b) => [b.id, b.text]));
      return {
        id: entry.id,
        title: entry.title,
        company: entry.company,
        startDate: entry.startDate,
        endDate: entry.endDate,
        bullets: selectedBulletTexts(sel.bullets, bulletById),
      };
    });

  const projectById = new Map(profile.projects.map((p) => [p.id, p]));
  const projects: TailoredProject[] = selection.projects
    .filter((sel) => sel.selected)
    .map((sel) => {
      const project = projectById.get(sel.id)!;
      const bulletById = new Map(project.bullets.map((b) => [b.id, b.text]));
      return {
        id: project.id,
        name: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        techStack: project.techStack,
        bullets: selectedBulletTexts(sel.bullets, bulletById),
      };
    });

  const skillById = new Map(profile.skills.map((s) => [s.id, s]));
  const skills = selection.skills
    .filter((sel) => sel.selected)
    .map((sel) => skillById.get(sel.id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  return {
    contact: profile.contact,
    summary: profile.summary,
    workExperience,
    projects,
    skills,
    education: profile.education,
    certifications: profile.certifications,
    // These sections don't currently participate in JD-based selection --
    // same as education/certifications above, they pass through unfiltered
    // from the master profile.
    volunteerWork: profile.volunteerWork,
    researchExperience: profile.researchExperience,
    leadership: profile.leadership,
    extraCurricular: profile.extraCurricular,
    associations: profile.associations,
    awardsAndHonors: profile.awardsAndHonors,
    conferencesPresentations: profile.conferencesPresentations,
    courses: profile.courses,
    patents: profile.patents,
    publications: profile.publications,
    publicationsAbstract: profile.publicationsAbstract,
    languages: profile.languages,
    hobbiesAndInterests: profile.hobbiesAndInterests,
    testScores: profile.testScores,
    references: profile.references,
  };
}
