import type { Request, Response } from "express";
import {
  scoreProfile,
  buildCoverLetter,
  buildTailoredResume,
  stripRichText,
  type CoverLetterContent,
  type ExtractedRequirements,
  type JobDescription,
  type Profile,
  type SelectionState,
} from "@resumebuilder/shared";
import { ResumeVersionModel } from "../models/ResumeVersion.js";
import { JobDescriptionModel } from "../models/JobDescription.js";
import { renderCoverLetterToPdf } from "../export/pdf.js";
import { buildCoverLetterDocx } from "../export/coverLetterDocx.js";
import { generateCoverLetterWithLlm } from "../services/llm/coverLetterGenerator.js";

interface CoverLetterContext {
  profile: Profile;
  jobDescription: JobDescription;
  requirements: ExtractedRequirements;
  selection: SelectionState;
  companyName?: string;
  hiringManagerName?: string;
}

function isAiCoverLetterRequested(req: Request): boolean {
  return req.query.ai === "true";
}

async function loadCoverLetterContext(resumeVersionId: string, query: Request["query"]): Promise<CoverLetterContext | null> {
  const versionDoc = await ResumeVersionModel.findById(resumeVersionId);
  if (!versionDoc) return null;

  const jdDoc = await JobDescriptionModel.findById(versionDoc.get("jobDescriptionId"));
  if (!jdDoc) return null;

  const jdObj = jdDoc.toObject();
  const requirements = jdObj.requirements as ExtractedRequirements;
  const jobDescription: JobDescription = {
    id: jdObj._id.toString(),
    rawText: jdObj.rawText,
    createdAt: jdObj.createdAt.toISOString(),
    requirements,
  };

  const versionObj = versionDoc.toObject();
  const profile = { ...versionObj.profileSnapshot, id: versionDoc.id } as Profile;
  const selection = versionObj.selection as SelectionState;

  const companyName = typeof query.companyName === "string" && query.companyName.trim() ? query.companyName : undefined;
  const hiringManagerName =
    typeof query.hiringManagerName === "string" && query.hiringManagerName.trim() ? query.hiringManagerName : undefined;

  return { profile, jobDescription, requirements, selection, companyName, hiringManagerName };
}

/** Up to 8 of the candidate's own selected, relevant bullets, stripped of rich-text markup, for the LLM prompt -- deliberately the same set already shown in "Build Your Resume", not a full resume dump. */
function relevantBulletsFor(profile: Profile, selection: SelectionState): string[] {
  const tailored = buildTailoredResume(profile, selection);
  const bullets = [...tailored.workExperience.flatMap((w) => w.bullets), ...tailored.projects.flatMap((p) => p.bullets)];
  return bullets.map(stripRichText).filter((text) => text.trim().length > 0).slice(0, 8);
}

async function resolveLetter(
  req: Request,
  context: CoverLetterContext
): Promise<{ letter: CoverLetterContent; method: "llm" | "deterministic"; provider?: string; model?: string }> {
  const { profile, jobDescription, requirements, selection, companyName, hiringManagerName } = context;
  const relevance = scoreProfile(profile, requirements);

  if (isAiCoverLetterRequested(req)) {
    try {
      const { letter, providerName, model } = await generateCoverLetterWithLlm({
        contact: profile.contact,
        jobTitle: jobDescription.requirements.title,
        companyName,
        hiringManagerName,
        matchedSkills: relevance.matchedMustHave,
        relevantBullets: relevantBulletsFor(profile, selection),
      });
      return { letter, method: "llm", provider: providerName, model };
    } catch (err) {
      console.error("LLM cover letter generation failed, falling back to the templated version:", err);
    }
  }

  const letter = buildCoverLetter(profile, jobDescription, relevance, selection, { companyName, hiringManagerName });
  return { letter, method: "deterministic" };
}

export async function getCoverLetter(req: Request, res: Response): Promise<void> {
  const context = await loadCoverLetterContext(req.params.id, req.query);
  if (!context) {
    res.status(404).json({ error: "Resume version or job description not found" });
    return;
  }

  const { letter, method, provider } = await resolveLetter(req, context);
  // Exposed as headers, not in the JSON body -- the body shape (CoverLetterContent)
  // stays identical regardless of which path produced it, which is what
  // PrintCoverLetterView and the DOCX export path both already expect and
  // don't need to change for; only the interactive UI's "Generate with AI"
  // action reads these to label the result accurately.
  res.setHeader("X-Cover-Letter-Method", method);
  if (provider) res.setHeader("X-Cover-Letter-Provider", provider);
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

  const pdfBuffer = await renderCoverLetterToPdf(req.params.id, {
    companyName,
    hiringManagerName,
    ai: isAiCoverLetterRequested(req),
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="cover-letter.pdf"');
  res.send(pdfBuffer);
}

export async function getCoverLetterDocx(req: Request, res: Response): Promise<void> {
  const context = await loadCoverLetterContext(req.params.id, req.query);
  if (!context) {
    res.status(404).json({ error: "Resume version or job description not found" });
    return;
  }

  const { letter } = await resolveLetter(req, context);
  const docxBuffer = await buildCoverLetterDocx(letter);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="cover-letter.docx"');
  res.send(docxBuffer);
}
