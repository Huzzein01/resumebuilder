import type { CareerToolKind, CareerToolResult } from "@resumebuilder/shared";
import { API_BASE_URL } from "./config.js";
import { aiModeHeader } from "../aiMode.js";

export interface CareerToolOptions {
  targetRole?: string;
  /** Interview Question Generator and Letter Review only. */
  jobDescription?: string;
  companyName?: string;
}

export async function fetchCareerToolInsights(
  kind: CareerToolKind,
  options: CareerToolOptions = {}
): Promise<CareerToolResult> {
  const res = await fetch(`${API_BASE_URL}/career-tools/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...aiModeHeader() },
    body: JSON.stringify(options),
  });
  if (!res.ok) throw new Error(`Failed to fetch ${kind} insights: ${res.status}`);
  return res.json();
}
