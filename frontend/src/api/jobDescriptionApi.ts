import type { JobDescription, JobDescriptionAnalysisResult } from "@resumebuilder/shared";
import { API_BASE_URL } from "./config.js";
import { aiModeHeader } from "../aiMode.js";

export async function submitJobDescription(rawText: string): Promise<JobDescriptionAnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/job-descriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...aiModeHeader() },
    body: JSON.stringify({ rawText }),
  });
  if (!res.ok) throw new Error(`Failed to analyze job description: ${res.status}`);
  return res.json();
}

export async function fetchJobDescriptions(): Promise<JobDescription[]> {
  const res = await fetch(`${API_BASE_URL}/job-descriptions`);
  if (!res.ok) throw new Error(`Failed to fetch job descriptions: ${res.status}`);
  return res.json();
}
