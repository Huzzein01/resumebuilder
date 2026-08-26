import type { JobDescription } from "@resumebuilder/shared";

export async function submitJobDescription(rawText: string): Promise<JobDescription> {
  const res = await fetch("/api/job-descriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawText }),
  });
  if (!res.ok) throw new Error(`Failed to analyze job description: ${res.status}`);
  return res.json();
}

export async function fetchJobDescriptions(): Promise<JobDescription[]> {
  const res = await fetch("/api/job-descriptions");
  if (!res.ok) throw new Error(`Failed to fetch job descriptions: ${res.status}`);
  return res.json();
}
