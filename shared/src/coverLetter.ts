import type { Profile, JobDescription, RelevanceResult, SelectionState, CoverLetterContent } from "./types.js";

function lowerFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

interface CoverLetterOptions {
  companyName?: string;
  hiringManagerName?: string;
}

function findTopSelectedBullet(
  profile: Profile,
  selection: SelectionState,
  relevance: RelevanceResult
): { title: string; company: string; bulletText: string } | undefined {
  let best: { title: string; company: string; bulletText: string; score: number } | undefined;

  for (const selEntry of selection.workExperience) {
    if (!selEntry.selected) continue;
    const entry = profile.workExperience.find((w) => w.id === selEntry.id);
    if (!entry) continue;
    const scoreEntry = relevance.workExperienceScores.find((w) => w.id === selEntry.id);
    const bulletById = new Map(entry.bullets.map((b) => [b.id, b.text]));
    const scoreByBulletId = new Map((scoreEntry?.bulletScores ?? []).map((b) => [b.bulletId, b.score]));

    for (const selBullet of selEntry.bullets) {
      if (!selBullet.selected) continue;
      const text = bulletById.get(selBullet.id);
      if (!text) continue;
      const score = scoreByBulletId.get(selBullet.id) ?? 0;
      if (!best || score > best.score) {
        best = { title: entry.title, company: entry.company, bulletText: text, score };
      }
    }
  }

  return best;
}

export function buildCoverLetter(
  profile: Profile,
  jobDescription: JobDescription,
  relevance: RelevanceResult,
  selection: SelectionState,
  options: CoverLetterOptions = {}
): CoverLetterContent {
  const { companyName, hiringManagerName } = options;
  const jobTitle = jobDescription.requirements.title;
  const matchedSkillNames = relevance.matchedMustHave.slice(0, 3);

  const roleClause = jobTitle ? `the ${jobTitle} role` : "this position";
  const companyClause = companyName ? ` at ${companyName}` : "";
  const skillsClause =
    matchedSkillNames.length > 0 ? matchedSkillNames.join(", ") : "a range of skills relevant to this role";

  const openingParagraph = `I am writing to express my interest in ${roleClause}${companyClause}. With experience in ${skillsClause}, I am confident I would be a strong fit for this position.`;

  const topBullet = findTopSelectedBullet(profile, selection, relevance);
  const bodyParagraph = topBullet
    ? `In my role as ${topBullet.title} at ${topBullet.company}, I ${lowerFirst(topBullet.bulletText).replace(/\.$/, "")}. This experience reflects the kind of impact I hope to bring to your team.`
    : "My background aligns well with the requirements of this role, and I'm eager to bring that experience to your team.";

  const closingParagraph =
    "I would welcome the opportunity to discuss how my experience and skills align with your team's needs. Thank you for your time and consideration.";

  return {
    contact: profile.contact,
    companyName,
    hiringManagerName,
    jobTitle,
    openingParagraph,
    bodyParagraph,
    closingParagraph,
  };
}
