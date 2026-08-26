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
  };
}
