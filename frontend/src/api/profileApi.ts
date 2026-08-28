import type { Profile, ProfileImportResult, ResumeHealthAiResult } from "@resumebuilder/shared";
import { API_BASE_URL } from "./config.js";
import { aiModeHeader } from "../aiMode.js";

export async function fetchProfile(): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/profile`);
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
  return res.json();
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error(`Failed to save profile: ${res.status}`);
  return res.json();
}

export async function importProfile(file: File): Promise<ProfileImportResult> {
  const formData = new FormData();
  formData.append("resume", file);
  const res = await fetch(`${API_BASE_URL}/profile/import`, {
    method: "POST",
    body: formData,
    headers: aiModeHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to import resume: ${res.status}`);
  }
  return res.json();
}

/**
 * Pass the current in-editor profile (e.g. right after an import, before
 * it's saved) to grade that exact data instead of whatever's last saved in
 * the database. Omit it to grade the saved copy, same as before.
 */
export async function fetchResumeHealthAi(profile?: Profile): Promise<ResumeHealthAiResult> {
  const res = await fetch(`${API_BASE_URL}/profile/health/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...aiModeHeader() },
    body: JSON.stringify(profile ? { profile } : {}),
  });
  if (!res.ok) throw new Error(`Failed to fetch AI resume feedback: ${res.status}`);
  return res.json();
}
