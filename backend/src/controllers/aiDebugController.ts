import type { Request, Response } from "express";
import { activeProviderName, resolveProvider } from "../services/llm/config.js";
import {
  reviewResume,
  optimizeForLinkedIn,
  generateInterviewQuestions,
  generateCoverLetter,
} from "../services/llm/features.js";

/**
 * Manual smoke-test surface for the AI layer -- hits each feature with a
 * small fixed fixture against whichever provider AI_PROVIDER selects, and
 * reports provider + model + latency alongside the output. The point is to
 * be able to flip AI_PROVIDER, re-run the same request, and compare results
 * side by side without touching any code.
 *
 * Never mounted in production (see index.ts): it runs uncapped model calls
 * with no auth, which is fine on a dev box and not fine on a public URL.
 */

const FIXTURE = {
  summary: "Backend engineer with 5 years building payment systems.",
  bullets: [
    {
      id: "b1",
      text: "Built a payments service handling millions of transactions",
      context: '"Backend Engineer" at Acme',
    },
  ],
  jobTitle: "Senior Backend Engineer",
  companyName: "Globex",
  jobDescription: "Seeking a backend engineer with distributed systems and payments experience.",
  skills: ["Node.js", "PostgreSQL", "Distributed Systems"],
  recentTitles: ["Backend Engineer"],
};

const PROFILE_SHAPE = {
  skillCount: 4,
  workExperienceCount: 1,
  projectCount: 0,
  educationCount: 1,
  certificationCount: 0,
};

type FeatureName = "review-resume" | "linkedin" | "interview-questions" | "cover-letter";

async function runFeature(feature: FeatureName) {
  switch (feature) {
    case "review-resume":
      return reviewResume({
        summary: FIXTURE.summary,
        bullets: FIXTURE.bullets,
        alreadyFlaggedCategories: [],
        profileShape: PROFILE_SHAPE,
      });
    case "linkedin":
      return optimizeForLinkedIn({
        summary: FIXTURE.summary,
        skills: FIXTURE.skills,
        recentTitles: FIXTURE.recentTitles,
        targetRole: FIXTURE.jobTitle,
      });
    case "interview-questions":
      return generateInterviewQuestions({
        summary: FIXTURE.summary,
        skills: FIXTURE.skills,
        recentTitles: FIXTURE.recentTitles,
        targetRole: FIXTURE.jobTitle,
        jobDescription: FIXTURE.jobDescription,
        companyName: FIXTURE.companyName,
      });
    case "cover-letter":
      return generateCoverLetter({
        contact: { name: "Jordan Lee", email: "jordan@example.com", phone: "", location: "", links: [] },
        companyName: FIXTURE.companyName,
        jobTitle: FIXTURE.jobTitle,
        matchedSkills: FIXTURE.skills,
        relevantBullets: FIXTURE.bullets.map((b) => b.text),
      });
  }
}

const FEATURES: FeatureName[] = ["review-resume", "linkedin", "interview-questions", "cover-letter"];

function isFeatureName(value: string): value is FeatureName {
  return (FEATURES as string[]).includes(value);
}

/** GET /api/ai-debug — which provider/model is active, without calling it. */
export async function getAiStatus(_req: Request, res: Response): Promise<void> {
  const name = activeProviderName();
  try {
    const provider = resolveProvider();
    res.json({
      provider: provider.name,
      model: provider.activeModel(),
      ready: true,
      features: FEATURES,
    });
  } catch (err) {
    // A config problem is the expected answer here (e.g. anthropic with no
    // key), not a server fault -- report it as readable status, not a 500.
    res.json({
      provider: name,
      ready: false,
      error: err instanceof Error ? err.message : String(err),
      features: FEATURES,
    });
  }
}

/** GET /api/ai-debug/:feature — run one feature end-to-end against the active provider. */
export async function runAiDebugFeature(req: Request, res: Response): Promise<void> {
  const feature = req.params.feature;
  if (!isFeatureName(feature)) {
    res.status(400).json({ error: `Unknown feature "${feature}". Valid: ${FEATURES.join(", ")}` });
    return;
  }

  const startedAt = Date.now();
  try {
    const result = await runFeature(feature);
    res.json({ feature, ms: Date.now() - startedAt, ...result });
  } catch (err) {
    // Surfaces the provider's own message verbatim -- the whole value of
    // this route is seeing "Can't reach Ollama at ... — is it running?"
    // rather than a generic failure.
    res.status(503).json({
      feature,
      ms: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
      errorType: err instanceof Error ? err.name : "Unknown",
    });
  }
}
