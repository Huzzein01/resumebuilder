import type { Request, Response } from "express";
import type { JobDescription } from "@resumebuilder/shared";
import { JobDescriptionModel } from "../models/JobDescription.js";
import { extractRequirements } from "../services/jdExtractor.js";

function toJobDescription(doc: any): JobDescription {
  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    rawText: obj.rawText,
    createdAt: obj.createdAt.toISOString(),
    requirements: obj.requirements,
  };
}

export async function createJobDescription(req: Request, res: Response): Promise<void> {
  const { rawText } = req.body as { rawText?: string };
  if (!rawText || !rawText.trim()) {
    res.status(400).json({ error: "rawText is required" });
    return;
  }

  const requirements = extractRequirements(rawText);
  const doc = await JobDescriptionModel.create({ rawText, requirements });
  res.status(201).json(toJobDescription(doc));
}

export async function listJobDescriptions(_req: Request, res: Response): Promise<void> {
  const docs = await JobDescriptionModel.find().sort({ createdAt: -1 });
  res.json(docs.map(toJobDescription));
}

export async function getJobDescription(req: Request, res: Response): Promise<void> {
  const doc = await JobDescriptionModel.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(toJobDescription(doc));
}
