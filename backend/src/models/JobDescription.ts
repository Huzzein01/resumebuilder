import { Schema, model } from "mongoose";

const MatchedSkillSchema = new Schema(
  {
    skillId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    matchedText: { type: String, required: true },
  },
  { _id: false }
);

const SeniorityInfoSchema = new Schema(
  {
    level: { type: String, required: true },
    yearsRequired: { type: Number },
  },
  { _id: false }
);

const ExtractedRequirementsSchema = new Schema(
  {
    mustHaveSkills: { type: [MatchedSkillSchema], default: [] },
    niceToHaveSkills: { type: [MatchedSkillSchema], default: [] },
    keywords: { type: [String], default: [] },
    seniority: { type: SeniorityInfoSchema, required: true },
    title: { type: String },
  },
  { _id: false }
);

const JobDescriptionSchema = new Schema({
  rawText: { type: String, required: true },
  requirements: { type: ExtractedRequirementsSchema, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const JobDescriptionModel = model("JobDescription", JobDescriptionSchema);
