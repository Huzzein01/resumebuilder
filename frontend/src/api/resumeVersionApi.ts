import type { ResumeVersion, SelectionState, CoverLetterContent, ResumeTemplateId } from "@resumebuilder/shared";
import { API_BASE_URL } from "./config.js";

export async function createResumeVersion(
  jobDescriptionId: string,
  selection: SelectionState,
  templateName?: ResumeTemplateId
): Promise<ResumeVersion> {
  const res = await fetch(`${API_BASE_URL}/resume-versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDescriptionId, selection, templateName }),
  });
  if (!res.ok) throw new Error(`Failed to create resume version: ${res.status}`);
  return res.json();
}

export async function fetchResumeVersion(id: string): Promise<ResumeVersion> {
  const res = await fetch(`${API_BASE_URL}/resume-versions/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch resume version: ${res.status}`);
  return res.json();
}

export async function listResumeVersions(): Promise<ResumeVersion[]> {
  const res = await fetch(`${API_BASE_URL}/resume-versions`);
  if (!res.ok) throw new Error(`Failed to list resume versions: ${res.status}`);
  return res.json();
}

export async function listTrashedResumeVersions(): Promise<ResumeVersion[]> {
  const res = await fetch(`${API_BASE_URL}/resume-versions/trash`);
  if (!res.ok) throw new Error(`Failed to list trashed resume versions: ${res.status}`);
  return res.json();
}

export async function renameResumeVersion(id: string, title: string): Promise<ResumeVersion> {
  const res = await fetch(`${API_BASE_URL}/resume-versions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to rename resume version: ${res.status}`);
  return res.json();
}

export async function trashResumeVersion(id: string): Promise<ResumeVersion> {
  const res = await fetch(`${API_BASE_URL}/resume-versions/${id}/trash`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to move resume version to trash: ${res.status}`);
  return res.json();
}

export async function restoreResumeVersion(id: string): Promise<ResumeVersion> {
  const res = await fetch(`${API_BASE_URL}/resume-versions/${id}/restore`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to restore resume version: ${res.status}`);
  return res.json();
}

export async function deleteResumeVersion(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/resume-versions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to permanently delete resume version: ${res.status}`);
}

export interface CoverLetterOptions {
  companyName?: string;
  hiringManagerName?: string;
  /** Explicit per-request opt-in for LLM generation -- independent of the global AI Mode toggle, since this is its own separate "Generate with AI" action, not something that should fire just because the toggle happens to be on. */
  ai?: boolean;
}

function coverLetterQuery(options: CoverLetterOptions): string {
  const params = new URLSearchParams();
  if (options.companyName) params.set("companyName", options.companyName);
  if (options.hiringManagerName) params.set("hiringManagerName", options.hiringManagerName);
  if (options.ai) params.set("ai", "true");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export interface CoverLetterFetchResult {
  letter: CoverLetterContent;
  method: "llm" | "deterministic";
  provider?: string;
}

export async function fetchCoverLetter(id: string, options: CoverLetterOptions = {}): Promise<CoverLetterFetchResult> {
  const res = await fetch(`${API_BASE_URL}/resume-versions/${id}/cover-letter${coverLetterQuery(options)}`);
  if (!res.ok) throw new Error(`Failed to fetch cover letter: ${res.status}`);
  const letter: CoverLetterContent = await res.json();
  const method = res.headers.get("X-Cover-Letter-Method") === "llm" ? "llm" : "deterministic";
  const provider = res.headers.get("X-Cover-Letter-Provider") ?? undefined;
  return { letter, method, provider };
}
