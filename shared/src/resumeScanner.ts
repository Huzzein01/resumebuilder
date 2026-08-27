import type { Profile, Bullet, WorkExperience, ProjectEntry, ScanSuggestion, ResumeScanResult } from "./types.js";
import { stripRichText } from "./richText.js";

const WEAK_OPENERS = /^\s*(responsible for|worked on|helped with|duties included|involved in)\b/i;
const FIRST_PERSON = /\b(i|my|me)\b/i;
const HAS_METRIC = /\d/;
const MAX_BULLET_LENGTH = 220;

function normalize(text: string): string {
  return stripRichText(text).trim().toLowerCase().replace(/\s+/g, " ");
}

function scanBullet(bullet: Bullet, targetType: "bullet", context: string): ScanSuggestion[] {
  const suggestions: ScanSuggestion[] = [];
  // Scan the plain-text form -- otherwise a leading <b> tag defeats the ^-anchored
  // WEAK_OPENERS check, tag markup inflates the length check, and raw HTML would
  // leak into the suggestion message previews below.
  const text = stripRichText(bullet.text).trim();
  if (!text) return suggestions;

  if (!HAS_METRIC.test(text)) {
    suggestions.push({
      id: `metric-${bullet.id}`,
      severity: "medium",
      category: "no-metrics",
      message: `"${text.slice(0, 60)}${text.length > 60 ? "…" : ""}" in ${context} has no number — consider quantifying the impact (scale, result, or improvement).`,
      targetType,
      targetId: bullet.id,
    });
  }

  if (WEAK_OPENERS.test(text)) {
    suggestions.push({
      id: `weak-opener-${bullet.id}`,
      severity: "medium",
      category: "weak-opener",
      message: `"${text.slice(0, 60)}${text.length > 60 ? "…" : ""}" in ${context} opens with a passive phrase — lead with a strong action verb instead.`,
      targetType,
      targetId: bullet.id,
    });
  }

  if (FIRST_PERSON.test(text)) {
    suggestions.push({
      id: `first-person-${bullet.id}`,
      severity: "low",
      category: "first-person",
      message: `"${text.slice(0, 60)}${text.length > 60 ? "…" : ""}" in ${context} uses a first-person pronoun — resumes conventionally drop the subject.`,
      targetType,
      targetId: bullet.id,
    });
  }

  if (text.length > MAX_BULLET_LENGTH) {
    suggestions.push({
      id: `too-long-${bullet.id}`,
      severity: "low",
      category: "bullet-too-long",
      message: `A bullet in ${context} is ${text.length} characters — consider tightening it to fit one line.`,
      targetType,
      targetId: bullet.id,
    });
  }

  return suggestions;
}

function scanDuplicateBullets(allBullets: { bullet: Bullet; context: string }[]): ScanSuggestion[] {
  const seen = new Map<string, { bullet: Bullet; context: string }>();
  const suggestions: ScanSuggestion[] = [];

  for (const entry of allBullets) {
    const key = normalize(entry.bullet.text);
    if (!key) continue;
    if (seen.has(key)) {
      suggestions.push({
        id: `duplicate-${entry.bullet.id}`,
        severity: "low",
        category: "duplicate-bullet",
        message: `The same bullet appears in both ${seen.get(key)!.context} and ${entry.context} — consider diversifying the impact described.`,
        targetType: "bullet",
        targetId: entry.bullet.id,
      });
    } else {
      seen.set(key, entry);
    }
  }

  return suggestions;
}

function scanWorkExperience(entry: WorkExperience): ScanSuggestion[] {
  const context = `"${entry.title}" at ${entry.company}`;
  const suggestions = entry.bullets.flatMap((b) => scanBullet(b, "bullet", context));

  if (entry.bullets.length === 0) {
    suggestions.push({
      id: `empty-experience-${entry.id}`,
      severity: "high",
      category: "empty-section",
      message: `${context} has no bullets — add at least one accomplishment.`,
      targetType: "workExperience",
      targetId: entry.id,
    });
  }

  return suggestions;
}

function scanProject(project: ProjectEntry): ScanSuggestion[] {
  const context = `the "${project.name}" project`;
  const suggestions = project.bullets.flatMap((b) => scanBullet(b, "bullet", context));

  if (project.bullets.length === 0) {
    suggestions.push({
      id: `empty-project-${project.id}`,
      severity: "high",
      category: "empty-section",
      message: `${context} has no bullets — add at least one accomplishment.`,
      targetType: "project",
      targetId: project.id,
    });
  }

  return suggestions;
}

function scanContact(profile: Profile): ScanSuggestion[] {
  const suggestions: ScanSuggestion[] = [];
  const { contact } = profile;

  if (!contact.email.trim()) {
    suggestions.push({
      id: "missing-email",
      severity: "high",
      category: "missing-contact",
      message: "No email address on file — add one so recruiters can reach you.",
      targetType: "contact",
    });
  }

  if (!contact.phone.trim() && !contact.location.trim()) {
    suggestions.push({
      id: "missing-phone-location",
      severity: "medium",
      category: "missing-contact",
      message: "No phone number or location on file — add at least one.",
      targetType: "contact",
    });
  }

  return suggestions;
}

function scanSkills(profile: Profile): ScanSuggestion[] {
  const suggestions: ScanSuggestion[] = [];

  for (const skill of profile.skills) {
    if (!skill.category.trim()) {
      suggestions.push({
        id: `uncategorized-skill-${skill.id}`,
        severity: "low",
        category: "uncategorized-skill",
        message: `"${skill.name}" has no category — categorizing helps grouping and matching.`,
        targetType: "skill",
        targetId: skill.id,
      });
    }
  }

  if (profile.skills.length === 0) {
    suggestions.push({
      id: "no-skills",
      severity: "high",
      category: "empty-section",
      message: "No skills listed — add the skills relevant to the roles you're targeting.",
      targetType: "general",
    });
  }

  return suggestions;
}

function scoreFromSuggestions(suggestions: ScanSuggestion[]): number {
  const penalty = { high: 8, medium: 4, low: 2 } as const;
  const total = suggestions.reduce((sum, s) => sum + penalty[s.severity], 0);
  return Math.max(0, 100 - total);
}

export function scanResume(profile: Profile): ResumeScanResult {
  const suggestions: ScanSuggestion[] = [
    ...scanContact(profile),
    ...profile.workExperience.flatMap(scanWorkExperience),
    ...profile.projects.flatMap(scanProject),
    ...scanSkills(profile),
  ];

  const allBullets = [
    ...profile.workExperience.flatMap((entry) =>
      entry.bullets.map((bullet) => ({ bullet, context: `"${entry.title}" at ${entry.company}` }))
    ),
    ...profile.projects.flatMap((project) =>
      project.bullets.map((bullet) => ({ bullet, context: `the "${project.name}" project` }))
    ),
  ];
  suggestions.push(...scanDuplicateBullets(allBullets));

  if (profile.workExperience.length === 0) {
    suggestions.push({
      id: "no-work-experience",
      severity: "high",
      category: "empty-section",
      message: "No work experience listed.",
      targetType: "general",
    });
  }

  const severityOrder = { high: 0, medium: 1, low: 2 } as const;
  suggestions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return { score: scoreFromSuggestions(suggestions), suggestions };
}
