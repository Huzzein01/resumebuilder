import type { Profile } from "@resumebuilder/shared";

export function toProfile(doc: any): Profile {
  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    contact: obj.contact,
    summary: obj.summary ?? "",
    workExperience: obj.workExperience,
    projects: obj.projects,
    volunteerWork: obj.volunteerWork ?? [],
    skills: obj.skills,
    education: obj.education,
    certifications: obj.certifications,
    // ?? [] on all of these: docs saved before these fields existed won't
    // have them at all, not just empty arrays.
    researchExperience: obj.researchExperience ?? [],
    leadership: obj.leadership ?? [],
    extraCurricular: obj.extraCurricular ?? [],
    associations: obj.associations ?? [],
    awardsAndHonors: obj.awardsAndHonors ?? [],
    conferencesPresentations: obj.conferencesPresentations ?? [],
    courses: obj.courses ?? [],
    patents: obj.patents ?? [],
    publications: obj.publications ?? [],
    publicationsAbstract: obj.publicationsAbstract ?? [],
    languages: obj.languages ?? [],
    hobbiesAndInterests: obj.hobbiesAndInterests ?? [],
    testScores: obj.testScores ?? [],
    references: obj.references ?? [],
  };
}
