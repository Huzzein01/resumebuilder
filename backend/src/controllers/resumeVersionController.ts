import type { Request, Response } from "express";
import {
  scoreProfile,
  buildTailoredResume,
  type ExtractedRequirements,
  type ResumeVersion,
  type SelectionState,
} from "@resumebuilder/shared";
import { JobDescriptionModel } from "../models/JobDescription.js";
import { ResumeVersionModel } from "../models/ResumeVersion.js";
import { getOrCreateDefaultProfileDoc } from "../services/profileStore.js";
import { toProfile } from "../utils/profileMapper.js";
import { renderResumeVersionToPdf } from "../export/pdf.js";
import { buildResumeDocx } from "../export/docx.js";

const TEMPLATE_NAME = "single-column";

function toResumeVersion(doc: any): ResumeVersion {
  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    jobDescriptionId: obj.jobDescriptionId,
    templateName: obj.templateName,
    profileSnapshot: obj.profileSnapshot,
    selection: obj.selection,
    overallScore: obj.overallScore,
    createdAt: obj.createdAt.toISOString(),
  };
}

export async function createResumeVersion(req: Request, res: Response): Promise<void> {
  const { jobDescriptionId, selection } = req.body as {
    jobDescriptionId?: string;
    selection?: SelectionState;
  };
  if (!jobDescriptionId || !selection) {
    res.status(400).json({ error: "jobDescriptionId and selection are required" });
    return;
  }

  const jdDoc = await JobDescriptionModel.findById(jobDescriptionId);
  if (!jdDoc) {
    res.status(404).json({ error: "Job description not found" });
    return;
  }

  const profileDoc = await getOrCreateDefaultProfileDoc();
  const profile = toProfile(profileDoc);
  const requirements = jdDoc.toObject().requirements as ExtractedRequirements;
  const relevance = scoreProfile(profile, requirements);

  const doc = await ResumeVersionModel.create({
    jobDescriptionId,
    templateName: TEMPLATE_NAME,
    profileSnapshot: profile,
    selection,
    overallScore: relevance.overallScore,
  });

  res.status(201).json(toResumeVersion(doc));
}

export async function getResumeVersion(req: Request, res: Response): Promise<void> {
  const doc = await ResumeVersionModel.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "Resume version not found" });
    return;
  }
  res.json(toResumeVersion(doc));
}

export async function getResumeVersionPdf(req: Request, res: Response): Promise<void> {
  const doc = await ResumeVersionModel.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "Resume version not found" });
    return;
  }

  const pdfBuffer = await renderResumeVersionToPdf(req.params.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');
  res.send(pdfBuffer);
}

export async function getResumeVersionDocx(req: Request, res: Response): Promise<void> {
  const doc = await ResumeVersionModel.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "Resume version not found" });
    return;
  }

  const version = toResumeVersion(doc);
  const resume = buildTailoredResume(version.profileSnapshot, version.selection);
  const docxBuffer = await buildResumeDocx(resume);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="resume.docx"');
  res.send(docxBuffer);
}
