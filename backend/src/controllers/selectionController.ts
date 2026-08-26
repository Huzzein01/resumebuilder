import type { Request, Response } from "express";
import { scoreProfile, type ExtractedRequirements } from "@resumebuilder/shared";
import { JobDescriptionModel } from "../models/JobDescription.js";
import { getOrCreateDefaultProfileDoc } from "../services/profileStore.js";
import { toProfile } from "../utils/profileMapper.js";
import { computeDefaultSelection } from "../services/selectionEngine.js";

export async function getSelection(req: Request, res: Response): Promise<void> {
  const jdDoc = await JobDescriptionModel.findById(req.params.jobDescriptionId);
  if (!jdDoc) {
    res.status(404).json({ error: "Job description not found" });
    return;
  }

  const profileDoc = await getOrCreateDefaultProfileDoc();
  const profile = toProfile(profileDoc);
  const requirements = jdDoc.toObject().requirements as ExtractedRequirements;
  const relevance = scoreProfile(profile, requirements);
  const selection = computeDefaultSelection(profile, relevance, req.params.jobDescriptionId);
  res.json(selection);
}
