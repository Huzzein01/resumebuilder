import { Schema, model } from "mongoose";

export const LinkSchema = new Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

export const ContactInfoSchema = new Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    links: { type: [LinkSchema], default: [] },
  },
  { _id: false }
);

export const BulletSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: "" },
  },
  { _id: false }
);

export const WorkExperienceSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, default: "" },
    company: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String },
    bullets: { type: [BulletSchema], default: [] },
  },
  { _id: false }
);

export const ProjectEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    startDate: { type: String },
    endDate: { type: String },
    techStack: { type: [String], default: [] },
    bullets: { type: [BulletSchema], default: [] },
  },
  { _id: false }
);

export const SkillSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    category: { type: String, default: "" },
    aliases: { type: [String], default: [] },
  },
  { _id: false }
);

export const EducationSchema = new Schema(
  {
    id: { type: String, required: true },
    school: { type: String, default: "" },
    degree: { type: String, default: "" },
    field: { type: String, default: "" },
    startDate: { type: String },
    endDate: { type: String },
  },
  { _id: false }
);

export const CertificationSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    issuer: { type: String, default: "" },
    date: { type: String },
  },
  { _id: false }
);

export const VolunteerWorkSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, default: "" },
    organization: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String },
    bullets: { type: [BulletSchema], default: [] },
  },
  { _id: false }
);

export const SimpleEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, default: "" },
    subtitle: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    bullets: { type: [BulletSchema], default: [] },
  },
  { _id: false }
);

export const TestScoreSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    score: { type: String, default: "" },
    date: { type: String },
  },
  { _id: false }
);

export const ReferenceEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    relationship: { type: String, default: "" },
    email: { type: String },
    phone: { type: String },
  },
  { _id: false }
);

const ProfileSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, default: "Master Profile" },
    contact: { type: ContactInfoSchema, required: true, default: () => ({}) },
    summary: { type: String, default: "" },
    workExperience: { type: [WorkExperienceSchema], default: [] },
    projects: { type: [ProjectEntrySchema], default: [] },
    volunteerWork: { type: [VolunteerWorkSchema], default: [] },
    skills: { type: [SkillSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    researchExperience: { type: [SimpleEntrySchema], default: [] },
    leadership: { type: [SimpleEntrySchema], default: [] },
    extraCurricular: { type: [SimpleEntrySchema], default: [] },
    associations: { type: [SimpleEntrySchema], default: [] },
    awardsAndHonors: { type: [SimpleEntrySchema], default: [] },
    conferencesPresentations: { type: [SimpleEntrySchema], default: [] },
    courses: { type: [SimpleEntrySchema], default: [] },
    patents: { type: [SimpleEntrySchema], default: [] },
    publications: { type: [BulletSchema], default: [] },
    publicationsAbstract: { type: [BulletSchema], default: [] },
    languages: { type: [String], default: [] },
    hobbiesAndInterests: { type: [String], default: [] },
    testScores: { type: [TestScoreSchema], default: [] },
    references: { type: [ReferenceEntrySchema], default: [] },
  },
  { timestamps: true }
);

export const ProfileModel = model("Profile", ProfileSchema);
