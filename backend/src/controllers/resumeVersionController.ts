import type { Request, Response } from "express";
import {
  scoreProfile,
  buildTailoredResume,
  isResumeTemplateId,
  DEFAULT_RESUME_TEMPLATE_ID,
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

function toResumeVersion(doc: any): ResumeVersion {
  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    jobDescriptionId: obj.jobDescriptionId,
    templateName: obj.templateName,
    profileSnapshot: obj.profileSnapshot,
    selection: obj.selection,
    overallScore: obj.overallScore,
    title: obj.title || "Untitled Resume",
    isTrashed: obj.isTrashed ?? false,
    trashedAt: obj.trashedAt ? obj.trashedAt.toISOString() : undefined,
    createdAt: obj.createdAt.toISOString(),
    updatedAt: (obj.updatedAt ?? obj.createdAt).toISOString(),
  };
}

export async function createResumeVersion(req: Request, res: Response): Promise<void> {
  const { jobDescriptionId, selection, templateName, title } = req.body as {
    jobDescriptionId?: string;
    selection?: SelectionState;
    templateName?: string;
    title?: string;
  };
  if (!jobDescriptionId || !selection) {
    res.status(400).json({ error: "jobDescriptionId and selection are required" });
    return;
  }
  const resolvedTemplateName = isResumeTemplateId(templateName) ? templateName : DEFAULT_RESUME_TEMPLATE_ID;

  const jdDoc = await JobDescriptionModel.findById(jobDescriptionId);
  if (!jdDoc) {
    res.status(404).json({ error: "Job description not found" });
    return;
  }

  const profileDoc = await getOrCreateDefaultProfileDoc();
  const profile = toProfile(profileDoc);
  const requirements = jdDoc.toObject().requirements as ExtractedRequirements;
  const relevance = scoreProfile(profile, requirements);

  const resolvedTitle =
    title?.trim() || (requirements.title ? `${requirements.title} Resume` : "Untitled Resume");

  const doc = await ResumeVersionModel.create({
    jobDescriptionId,
    templateName: resolvedTemplateName,
    profileSnapshot: profile,
    selection,
    overallScore: relevance.overallScore,
    title: resolvedTitle,
  });

  res.status(201).json(toResumeVersion(doc));
}

/** My Drive: every non-trashed resume version, most recently updated first. */
export async function listResumeVersions(_req: Request, res: Response): Promise<void> {
  const docs = await ResumeVersionModel.find({ isTrashed: { $ne: true } }).sort({ updatedAt: -1 });
  res.json(docs.map(toResumeVersion));
}

/** Trash: every trashed resume version, most recently trashed first. */
export async function listTrashedResumeVersions(_req: Request, res: Response): Promise<void> {
  const docs = await ResumeVersionModel.find({ isTrashed: true }).sort({ trashedAt: -1 });
  res.json(docs.map(toResumeVersion));
}

export async function renameResumeVersion(req: Request, res: Response): Promise<void> {
  const { title } = req.body as { title?: string };
  if (!title || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const doc = await ResumeVersionModel.findByIdAndUpdate(
    req.params.id,
    { title: title.trim() },
    { new: true }
  );
  if (!doc) {
    res.status(404).json({ error: "Resume version not found" });
    return;
  }
  res.json(toResumeVersion(doc));
}

export async function trashResumeVersion(req: Request, res: Response): Promise<void> {
  const doc = await ResumeVersionModel.findByIdAndUpdate(
    req.params.id,
    { isTrashed: true, trashedAt: new Date() },
    { new: true }
  );
  if (!doc) {
    res.status(404).json({ error: "Resume version not found" });
    return;
  }
  res.json(toResumeVersion(doc));
}

export async function restoreResumeVersion(req: Request, res: Response): Promise<void> {
  const doc = await ResumeVersionModel.findByIdAndUpdate(
    req.params.id,
    { isTrashed: false, trashedAt: undefined },
    { new: true }
  );
  if (!doc) {
    res.status(404).json({ error: "Resume version not found" });
    return;
  }
  res.json(toResumeVersion(doc));
}

/** Permanent delete -- only from the trash, so nothing can be destroyed without the trash step first. */
export async function deleteResumeVersion(req: Request, res: Response): Promise<void> {
  const doc = await ResumeVersionModel.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "Resume version not found" });
    return;
  }
  if (!doc.get("isTrashed")) {
    res.status(400).json({ error: "Move to trash before permanently deleting." });
    return;
  }
  await doc.deleteOne();
  res.status(204).send();
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
