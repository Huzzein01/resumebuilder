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

  if (!contact.name.trim()) {
    suggestions.push({
      id: "missing-name",
      severity: "high",
      category: "missing-contact",
      message: "No name on file — add your name so this reads as an actual resume.",
      targetType: "contact",
    });
  }

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

function scanSummary(profile: Profile): ScanSuggestion[] {
  const text = stripRichText(profile.summary).trim();
  if (text) return [];
  return [
    {
      id: "missing-summary",
      severity: "medium",
      category: "missing-summary",
      message: "No summary — a 2-3 sentence overview at the top helps recruiters place you quickly.",
      targetType: "general",
    },
  ];
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

// Missing an entire required part of the resume (no name, no email, no
// skills, no work experience, an empty entry, no summary) is a fundamentally
// different problem from a wording nitpick on a bullet that otherwise
// exists -- so the two are scored on separate scales instead of one flat
// per-suggestion penalty. Structural gaps are weighted heavily enough that
// a genuinely blank profile (missing every one of these) lands at 0, not
// the ~72 the old flat 8/4/2 weights produced. Bullet-level wording issues
// (no-metrics, weak-opener, first-person, too-long, duplicate, uncategorized
// skill) stay lightweight per instance *and* capped in total, so a resume
// with real content and a handful of stylistic nits can't be dragged toward
// 0 the way a missing section can -- ten so-so bullets shouldn't score worse
// than one truly empty resume.
const STRUCTURAL_CATEGORIES = new Set(["missing-contact", "missing-summary", "empty-section"]);
const STRUCTURAL_PENALTY = { high: 20, medium: 10, low: 5 } as const;
const QUALITY_ISSUE_PENALTY = 4;
const MAX_QUALITY_PENALTY = 20;

function scoreFromSuggestions(suggestions: ScanSuggestion[]): number {
  let structuralPenalty = 0;
  let qualityPenalty = 0;

  for (const s of suggestions) {
    if (STRUCTURAL_CATEGORIES.has(s.category)) {
      structuralPenalty += STRUCTURAL_PENALTY[s.severity];
    } else {
      qualityPenalty += QUALITY_ISSUE_PENALTY;
    }
  }
  qualityPenalty = Math.min(qualityPenalty, MAX_QUALITY_PENALTY);

  return Math.max(0, 100 - structuralPenalty - qualityPenalty);
}

export function scanResume(profile: Profile): ResumeScanResult {
  const suggestions: ScanSuggestion[] = [
    ...scanContact(profile),
    ...scanSummary(profile),
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
