import type { RelevanceResult } from "@resumebuilder/shared";
import { API_BASE_URL } from "./config.js";

export async function fetchRelevance(jobDescriptionId: string): Promise<RelevanceResult> {
  const res = await fetch(`${API_BASE_URL}/relevance/${jobDescriptionId}`);
  if (!res.ok) throw new Error(`Failed to score profile: ${res.status}`);
  return res.json();
}
