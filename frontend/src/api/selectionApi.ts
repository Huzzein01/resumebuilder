import type { SelectionState } from "@resumebuilder/shared";

export async function fetchSelection(jobDescriptionId: string): Promise<SelectionState> {
  const res = await fetch(`/api/selection/${jobDescriptionId}`);
  if (!res.ok) throw new Error(`Failed to fetch selection: ${res.status}`);
  return res.json();
}
