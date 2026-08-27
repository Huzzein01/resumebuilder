import type { Request, Response } from "express";
import type { JobDescription, JobDescriptionAnalysisResult } from "@resumebuilder/shared";
import { JobDescriptionModel } from "../models/JobDescription.js";
import { extractRequirements } from "../services/jdExtractor.js";
import { enhanceRequirementsWithLlm } from "../services/llm/jdEnhancer.js";
import { isAiModeRequested } from "../middleware/aiMode.js";

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

  const deterministicRequirements = extractRequirements(rawText);

  // Same contract as resume import: the LLM path only runs when the user
  // has switched into AI mode, merges into (never replaces) the
  // deterministic result, and any failure falls back to the deterministic
  // requirements alone -- what actually gets persisted is always the final,
  // merged requirements, so scoring downstream (scoreProfile) works exactly
  // the same regardless of which path produced it.
  if (isAiModeRequested(req)) {
    try {
      const { requirements, additionalSkillsDetected, providerName } = await enhanceRequirementsWithLlm(
        rawText,
        deterministicRequirements
      );
      const doc = await JobDescriptionModel.create({ rawText, requirements });
      const result: JobDescriptionAnalysisResult = {
        jobDescription: toJobDescription(doc),
        method: "llm",
        provider: providerName,
        additionalSkillsDetected: additionalSkillsDetected.length > 0 ? additionalSkillsDetected : undefined,
      };
      res.status(201).json(result);
      return;
    } catch (err) {
      console.error("LLM JD analysis failed, falling back to deterministic extraction:", err);
    }
  }

  const doc = await JobDescriptionModel.create({ rawText, requirements: deterministicRequirements });
  const result: JobDescriptionAnalysisResult = { jobDescription: toJobDescription(doc), method: "deterministic" };
  res.status(201).json(result);
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
