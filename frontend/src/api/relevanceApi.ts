import type { RelevanceResult } from "@resumebuilder/shared";

export async function fetchRelevance(jobDescriptionId: string): Promise<RelevanceResult> {
  const res = await fetch(`/api/relevance/${jobDescriptionId}`);
  if (!res.ok) throw new Error(`Failed to score profile: ${res.status}`);
  return res.json();
}
