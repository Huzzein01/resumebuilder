import type { CareerToolKind, CareerToolResult } from "@resumebuilder/shared";
import { API_BASE_URL } from "./config.js";
import { aiModeHeader } from "../aiMode.js";

export async function fetchCareerToolInsights(kind: CareerToolKind, targetRole?: string): Promise<CareerToolResult> {
  const query = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : "";
  const res = await fetch(`${API_BASE_URL}/career-tools/${kind}${query}`, { headers: aiModeHeader() });
  if (!res.ok) throw new Error(`Failed to fetch ${kind} insights: ${res.status}`);
  return res.json();
}
