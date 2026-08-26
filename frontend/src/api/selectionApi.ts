import type { SelectionState } from "@resumebuilder/shared";
import { API_BASE_URL } from "./config.js";

export async function fetchSelection(jobDescriptionId: string): Promise<SelectionState> {
  const res = await fetch(`${API_BASE_URL}/selection/${jobDescriptionId}`);
  if (!res.ok) throw new Error(`Failed to fetch selection: ${res.status}`);
  return res.json();
}
