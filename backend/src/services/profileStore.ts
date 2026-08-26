import { ProfileModel } from "../models/Profile.js";

const DEFAULT_SLUG = "default";

export async function getOrCreateDefaultProfileDoc() {
  let doc = await ProfileModel.findOne({ slug: DEFAULT_SLUG });
  if (!doc) {
    doc = await ProfileModel.create({
      slug: DEFAULT_SLUG,
      contact: { name: "", email: "", phone: "", location: "", links: [] },
      summary: "",
      workExperience: [],
      projects: [],
      volunteerWork: [],
      skills: [],
      education: [],
      certifications: [],
    });
  }
  return doc;
}

export { DEFAULT_SLUG };
