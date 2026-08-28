import type { Request, Response } from "express";
import { scanResume, stripRichText, type ResumeHealthAiResult } from "@resumebuilder/shared";
import { ProfileModel } from "../models/Profile.js";
import { getOrCreateDefaultProfileDoc, DEFAULT_SLUG } from "../services/profileStore.js";
import { toProfile } from "../utils/profileMapper.js";
import { generateResumeHealthSuggestionsWithLlm } from "../services/llm/resumeHealthAnalyzer.js";
import { isAiModeRequested } from "../middleware/aiMode.js";

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
 */
export async function getResumeHealthAi(req: Request, res: Response): Promise<void> {
  if (!isAiModeRequested(req)) {
    const result: ResumeHealthAiResult = { suggestions: [], method: "unavailable" };
    res.json(result);
    return;
  }

  const doc = await getOrCreateDefaultProfileDoc();
  const profile = toProfile(doc);
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
    const { suggestions, providerName } = await generateResumeHealthSuggestionsWithLlm({
      summary: stripRichText(profile.summary),
      bullets,
      alreadyFlaggedCategories,
    });
    const result: ResumeHealthAiResult = { suggestions, method: "llm", provider: providerName };
    res.json(result);
  } catch (err) {
    console.error("LLM resume health suggestions failed:", err);
    const result: ResumeHealthAiResult = { suggestions: [], method: "unavailable" };
    res.json(result);
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const {
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
