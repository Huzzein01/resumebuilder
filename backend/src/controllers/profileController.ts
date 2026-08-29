import type { Request, Response } from "express";
import {
  scanResume,
  stripRichText,
  buildFullResume,
  isResumeTemplateId,
  DEFAULT_RESUME_TEMPLATE_ID,
  type Profile,
  type ResumeHealthAiResult,
} from "@resumebuilder/shared";
import { ProfileModel } from "../models/Profile.js";
import { getOrCreateDefaultProfileDoc, DEFAULT_SLUG } from "../services/profileStore.js";
import { toProfile } from "../utils/profileMapper.js";
import { generateResumeHealthSuggestionsWithLlm } from "../services/llm/resumeHealthAnalyzer.js";
import { isAiModeRequested } from "../middleware/aiMode.js";
import { renderProfileToPdf } from "../export/pdf.js";
import { buildResumeDocx } from "../export/docx.js";

export async function getProfile(_req: Request, res: Response): Promise<void> {
  const doc = await getOrCreateDefaultProfileDoc();
  res.json(toProfile(doc));
}

/**
 * Purely additive on top of the deterministic Resume Health scan -- the
 * score and rule-based suggestions computed client-side in ProfileEditor
 * never change. Manual mode never reaches the LLM at all (mirrors every
 * other AI-gated endpoint); within AI mode, any failure (no key
 * configured, every provider down, bad output) is swallowed and reported
 * back as method: "unavailable" rather than a 500, since this is
 * supplementary feedback the page can simply omit.
 *
 * Accepts an optional `profile` in the POST body so it can grade
 * whatever's actually in the editor right now -- including a resume
 * just parsed from an upload that hasn't been saved yet -- rather than
 * only ever reading the last-saved copy from the database, which would
 * silently grade stale data immediately after an import.
 */
export async function getResumeHealthAi(req: Request, res: Response): Promise<void> {
  if (!isAiModeRequested(req)) {
    const result: ResumeHealthAiResult = { strengths: [], suggestions: [], method: "unavailable" };
    res.json(result);
    return;
  }

  const suppliedProfile = req.body?.profile as Profile | undefined;
  let profile: Profile;
  if (suppliedProfile) {
    profile = suppliedProfile;
  } else {
    const doc = await getOrCreateDefaultProfileDoc();
    profile = toProfile(doc);
  }
  const scan = scanResume(profile);
  const alreadyFlaggedCategories = [...new Set(scan.suggestions.map((s) => s.category))];

  const bullets = [
    ...profile.workExperience.flatMap((entry) =>
      entry.bullets.map((b) => ({
        id: b.id,
        text: stripRichText(b.text),
        context: `"${entry.title}" at ${entry.company}`,
      }))
    ),
    ...profile.projects.flatMap((project) =>
      project.bullets.map((b) => ({
        id: b.id,
        text: stripRichText(b.text),
        context: `the "${project.name}" project`,
      }))
    ),
  ];

  try {
    const { strengths, suggestions, providerName, model } = await generateResumeHealthSuggestionsWithLlm({
      summary: stripRichText(profile.summary),
      bullets,
      alreadyFlaggedCategories,
      profileShape: {
        skillCount: profile.skills.length,
        workExperienceCount: profile.workExperience.length,
        projectCount: profile.projects.length,
        educationCount: profile.education.length,
        certificationCount: profile.certifications.length,
      },
    });
    const result: ResumeHealthAiResult = { strengths, suggestions, method: "llm", provider: providerName, model };
    res.json(result);
  } catch (err) {
    console.error("LLM resume health suggestions failed:", err);
    const result: ResumeHealthAiResult = { strengths: [], suggestions: [], method: "unavailable" };
    res.json(result);
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const {
    title,
    contact,
    summary,
    workExperience,
    projects,
    volunteerWork,
    skills,
    education,
    certifications,
    researchExperience,
    leadership,
    extraCurricular,
    associations,
    awardsAndHonors,
    conferencesPresentations,
    courses,
    patents,
    publications,
    publicationsAbstract,
    languages,
    hobbiesAndInterests,
    testScores,
    references,
  } = req.body;

  const doc = await ProfileModel.findOneAndUpdate(
    { slug: DEFAULT_SLUG },
    {
      title: title?.trim() || "Master Profile",
      contact,
      summary,
      workExperience,
      projects,
      volunteerWork,
      skills,
      education,
      certifications,
      researchExperience,
      leadership,
      extraCurricular,
      associations,
      awardsAndHonors,
      conferencesPresentations,
      courses,
      patents,
      publications,
      publicationsAbstract,
      languages,
      hobbiesAndInterests,
      testScores,
      references,
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(toProfile(doc));
}

/**
 * Download the whole Master Profile as-is (every section, nothing tailored
 * out for a job description) in the currently-selected template -- the
 * "Download" action in the Resume Builder's top bar. Distinct from the
 * ResumeVersion PDF/DOCX routes, which require a jobDescriptionId + a
 * selection tied to that JD's relevance scoring and don't apply here.
 */
export async function exportProfilePdf(req: Request, res: Response): Promise<void> {
  const templateId = isResumeTemplateId(req.query.template) ? req.query.template : DEFAULT_RESUME_TEMPLATE_ID;
  const pdfBuffer = await renderProfileToPdf(templateId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');
  res.send(pdfBuffer);
}

export async function exportProfileDocx(req: Request, res: Response): Promise<void> {
  const doc = await getOrCreateDefaultProfileDoc();
  const profile = toProfile(doc);
  const resume = buildFullResume(profile);
  const docxBuffer = await buildResumeDocx(resume);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="resume.docx"');
  res.send(docxBuffer);
}
