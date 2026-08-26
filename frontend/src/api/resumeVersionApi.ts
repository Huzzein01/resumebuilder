import type { ResumeVersion, SelectionState, CoverLetterContent } from "@resumebuilder/shared";

export async function createResumeVersion(
  jobDescriptionId: string,
  selection: SelectionState
): Promise<ResumeVersion> {
  const res = await fetch("/api/resume-versions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDescriptionId, selection }),
  });
  if (!res.ok) throw new Error(`Failed to create resume version: ${res.status}`);
  return res.json();
}

export async function fetchResumeVersion(id: string): Promise<ResumeVersion> {
  const res = await fetch(`/api/resume-versions/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch resume version: ${res.status}`);
  return res.json();
}

export interface CoverLetterOptions {
  companyName?: string;
  hiringManagerName?: string;
}

function coverLetterQuery(options: CoverLetterOptions): string {
  const params = new URLSearchParams();
  if (options.companyName) params.set("companyName", options.companyName);
  if (options.hiringManagerName) params.set("hiringManagerName", options.hiringManagerName);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchCoverLetter(id: string, options: CoverLetterOptions = {}): Promise<CoverLetterContent> {
  const res = await fetch(`/api/resume-versions/${id}/cover-letter${coverLetterQuery(options)}`);
  if (!res.ok) throw new Error(`Failed to fetch cover letter: ${res.status}`);
  return res.json();
}
