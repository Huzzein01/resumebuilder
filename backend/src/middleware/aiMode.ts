import type { Request } from "express";

/**
 * Reads the frontend's global AI Mode toggle (sent as a header on every
 * request with an AI-augmented path). This gates whether an LLM call is
 * attempted *at all*, independent of whether a provider key happens to be
 * configured -- the user's explicit choice, not just key presence, controls
 * whether the app calls out to a model.
 */
export function isAiModeRequested(req: Request): boolean {
  return req.header("x-ai-mode") === "true";
}
