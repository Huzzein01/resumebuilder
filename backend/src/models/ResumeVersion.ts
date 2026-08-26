import { Schema, model } from "mongoose";
import {
  ContactInfoSchema,
  WorkExperienceSchema,
  ProjectEntrySchema,
  VolunteerWorkSchema,
  SkillSchema,
  EducationSchema,
  CertificationSchema,
} from "./Profile.js";

const ProfileSnapshotSchema = new Schema(
  {
    contact: { type: ContactInfoSchema, default: () => ({}) },
    summary: { type: String, default: "" },
    workExperience: { type: [WorkExperienceSchema], default: [] },
    projects: { type: [ProjectEntrySchema], default: [] },
    volunteerWork: { type: [VolunteerWorkSchema], default: [] },
    skills: { type: [SkillSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
  },
  { _id: false }
);

const ItemSelectionSchema = new Schema(
  {
    id: { type: String, required: true },
    selected: { type: Boolean, required: true },
  },
  { _id: false }
);

const BulletedItemSelectionSchema = new Schema(
  {
    id: { type: String, required: true },
    selected: { type: Boolean, required: true },
    bullets: { type: [ItemSelectionSchema], default: [] },
  },
  { _id: false }
);

const SelectionStateSchema = new Schema(
  {
    jobDescriptionId: { type: String, required: true },
    workExperience: { type: [BulletedItemSelectionSchema], default: [] },
    projects: { type: [BulletedItemSelectionSchema], default: [] },
    skills: { type: [ItemSelectionSchema], default: [] },
  },
  { _id: false }
);

const ResumeVersionSchema = new Schema({
  jobDescriptionId: { type: String, required: true },
  templateName: { type: String, required: true },
  profileSnapshot: { type: ProfileSnapshotSchema, required: true },
  selection: { type: SelectionStateSchema, required: true },
  overallScore: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const ResumeVersionModel = model("ResumeVersion", ResumeVersionSchema);
