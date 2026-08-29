/**
 * The single canonical list of drag-reorderable resume sections. Ids match
 * the Resume Builder sidebar's SECTION_ITEMS ids for these same sections
 * (frontend/src/pages/ProfileEditor.tsx) -- dragging a row there writes this
 * same id into Profile.sectionOrder, which flows through buildFullResume/
 * buildTailoredResume onto TailoredResume.sectionOrder, which both resume
 * templates read to decide render order. One id space, one order, used for
 * the sidebar list, the wizard's Back/Next sequence, and the actual
 * rendered/exported resume -- not three independent orderings that could
 * drift from each other.
 *
 * Contact Info is deliberately not here: it's the resume's header, not a
 * reorderable `resume-section`, so it's always first regardless of
 * sectionOrder.
 */
export const RESUME_SECTION_ORDER = [
  "summary",
  "skills",
  "work-experience",
  "projects",
  "education",
  "certifications",
  "volunteer-work",
  "research-experience",
  "leadership",
  "extra-curricular",
  "associations",
  "awards-honors",
  "conferences-presentations",
  "courses",
  "patents",
  "publications",
  "publications-abstract",
  "test-scores",
  "languages",
  "hobbies-interests",
  "references",
] as const;

export type ResumeSectionId = (typeof RESUME_SECTION_ORDER)[number];

/**
 * Resolves a (possibly missing, possibly partial/stale) custom order into a
 * complete, valid ordering: known ids from `custom` first in the order
 * given, then any RESUME_SECTION_ORDER ids not mentioned (a section added
 * to the app after this profile last saved an order, for instance) appended
 * in their default position -- so a partial or absent order never drops a
 * section from the resume, it just falls back to the default position.
 * Unknown ids (stale data from a removed section) are silently dropped.
 */
export function resolveSectionOrder(custom?: string[]): ResumeSectionId[] {
  const known = new Set<string>(RESUME_SECTION_ORDER);
  const validCustom = (custom ?? []).filter((id): id is ResumeSectionId => known.has(id));
  const seen = new Set(validCustom);
  const remaining = RESUME_SECTION_ORDER.filter((id) => !seen.has(id));
  return [...validCustom, ...remaining];
}
