import type { Request, Response } from "express";
import {
  scoreProfile,
  buildCoverLetter,
  type ExtractedRequirements,
  type JobDescription,
  type Profile,
  type SelectionState,
} from "@resumebuilder/shared";
import { ResumeVersionModel } from "../models/ResumeVersion.js";
import { JobDescriptionModel } from "../models/JobDescription.js";
import { renderCoverLetterToPdf } from "../export/pdf.js";
import { buildCoverLetterDocx } from "../export/coverLetterDocx.js";

async function loadCoverLetterInputs(resumeVersionId: string, query: Request["query"]) {
  const versionDoc = await ResumeVersionModel.findById(resumeVersionId);
  if (!versionDoc) return null;

  const jdDoc = await JobDescriptionModel.findById(versionDoc.get("jobDescriptionId"));
  if (!jdDoc) return null;

  const jdObj = jdDoc.toObject();
  const jobDescription: JobDescription = {
    id: jdObj._id.toString(),
    rawText: jdObj.rawText,
    createdAt: jdObj.createdAt.toISOString(),
    requirements: jdObj.requirements as ExtractedRequirements,
  };

  const versionObj = versionDoc.toObject();
  const profile = { ...versionObj.profileSnapshot, id: versionDoc.id } as Profile;
  const selection = versionObj.selection as SelectionState;
  const relevance = scoreProfile(profile, jobDescription.requirements);

  const companyName = typeof query.companyName === "string" && query.companyName.trim() ? query.companyName : undefined;
  const hiringManagerName =
    typeof query.hiringManagerName === "string" && query.hiringManagerName.trim() ? query.hiringManagerName : undefined;

  const letter = buildCoverLetter(profile, jobDescription, relevance, selection, { companyName, hiringManagerName });
  return letter;
}

export async function getCoverLetter(req: Request, res: Response): Promise<void> {
  const letter = await loadCoverLetterInputs(req.params.id, req.query);
  if (!letter) {
    res.status(404).json({ error: "Resume version or job description not found" });
    return;
  }
  res.json(letter);
}

export async function getCoverLetterPdf(req: Request, res: Response): Promise<void> {
  const versionDoc = await ResumeVersionModel.findById(req.params.id);
  if (!versionDoc) {
    res.status(404).json({ error: "Resume version not found" });
    return;
  }

  const companyName = typeof req.query.companyName === "string" ? req.query.companyName : undefined;
  const hiringManagerName = typeof req.query.hiringManagerName === "string" ? req.query.hiringManagerName : undefined;

  const pdfBuffer = await renderCoverLetterToPdf(req.params.id, { companyName, hiringManagerName });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="cover-letter.pdf"');
  res.send(pdfBuffer);
}

export async function getCoverLetterDocx(req: Request, res: Response): Promise<void> {
  const letter = await loadCoverLetterInputs(req.params.id, req.query);
  if (!letter) {
    res.status(404).json({ error: "Resume version or job description not found" });
    return;
  }

  const docxBuffer = await buildCoverLetterDocx(letter);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="cover-letter.docx"');
  res.send(docxBuffer);
}
