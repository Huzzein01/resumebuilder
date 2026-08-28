import type { Request, Response } from "express";
import { stripRichText, type CareerToolKind, type CareerToolResult } from "@resumebuilder/shared";
import { getOrCreateDefaultProfileDoc } from "../services/profileStore.js";
import { toProfile } from "../utils/profileMapper.js";
import { generateCareerToolInsights } from "../services/llm/careerToolsGenerator.js";
import { isAiModeRequested } from "../middleware/aiMode.js";

const VALID_KINDS: CareerToolKind[] = [
  "interview-questions",
  "career-path",
  "career-financials",
  "linkedin-optimization",
  "letter-review",
];

function isCareerToolKind(value: string): value is CareerToolKind {
  return (VALID_KINDS as string[]).includes(value);
}

/**
 * All five career tools (Interview Question Generator, Career Path, Career
 * Financials, LinkedIn Optimization, Letter Review) are AI-only -- Manual
 * mode never reaches the LLM, and any failure in AI mode (no key, every
 * provider down, bad output) is reported as method: "unavailable" rather
 * than a 500, same contract as getResumeHealthAi.
 */
export async function getCareerToolInsights(req: Request, res: Response): Promise<void> {
  const kind = req.params.kind;
  if (!isCareerToolKind(kind)) {
    res.status(400).json({ error: `Unknown career tool: ${kind}` });
    return;
  }

  if (!isAiModeRequested(req)) {
    const result: CareerToolResult = { kind, insights: [], method: "unavailable" };
    res.json(result);
    return;
  }

  const doc = await getOrCreateDefaultProfileDoc();
  const profile = toProfile(doc);
  const body = req.body as { targetRole?: string; jobDescription?: string; companyName?: string };
  const targetRole = typeof body.targetRole === "string" ? body.targetRole : undefined;
  const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription : undefined;
  const companyName = typeof body.companyName === "string" ? body.companyName : undefined;

  try {
    const { insights, providerName } = await generateCareerToolInsights({
      kind,
      summary: stripRichText(profile.summary),
      skills: profile.skills.map((s) => s.name),
      recentTitles: profile.workExperience.map((w) => w.title),
      targetRole,
      jobDescription,
      companyName,
    });
    const result: CareerToolResult = { kind, insights, method: "llm", provider: providerName };
    res.json(result);
  } catch (err) {
    console.error(`LLM career tool "${kind}" failed:`, err);
    const result: CareerToolResult = { kind, insights: [], method: "unavailable" };
    res.json(result);
  }
}
