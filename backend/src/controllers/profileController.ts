import type { Request, Response } from "express";
import { ProfileModel } from "../models/Profile.js";
import { getOrCreateDefaultProfileDoc, DEFAULT_SLUG } from "../services/profileStore.js";
import { toProfile } from "../utils/profileMapper.js";

export async function getProfile(_req: Request, res: Response): Promise<void> {
  const doc = await getOrCreateDefaultProfileDoc();
  res.json(toProfile(doc));
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { contact, summary, workExperience, projects, volunteerWork, skills, education, certifications } = req.body;

  const doc = await ProfileModel.findOneAndUpdate(
    { slug: DEFAULT_SLUG },
    { contact, summary, workExperience, projects, volunteerWork, skills, education, certifications },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(toProfile(doc));
}
