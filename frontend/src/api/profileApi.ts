import type { Profile, ProfileDraft } from "@resumebuilder/shared";

export async function fetchProfile(): Promise<Profile> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
  return res.json();
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error(`Failed to save profile: ${res.status}`);
  return res.json();
}

export async function importProfile(file: File): Promise<ProfileDraft> {
  const formData = new FormData();
  formData.append("resume", file);
  const res = await fetch("/api/profile/import", { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to import resume: ${res.status}`);
  }
  return res.json();
}
