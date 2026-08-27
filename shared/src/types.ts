export interface Link {
  label: string;
  url: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: Link[];
}

export interface Bullet {
  id: string;
  text: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  bullets: Bullet[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  techStack: string[];
  bullets: Bullet[];
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  aliases: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date?: string;
}

export interface VolunteerWork {
  id: string;
  role: string;
  organization: string;
  startDate: string;
  endDate?: string;
  bullets: Bullet[];
}

export interface Profile {
  id: string;
  contact: ContactInfo;
  summary: string;
  workExperience: WorkExperience[];
  projects: ProjectEntry[];
  volunteerWork: VolunteerWork[];
  skills: Skill[];
  education: Education[];
  certifications: Certification[];
}

export type ProfileDraft = Omit<Profile, "id">;

export interface ProfileImportResult {
  draft: ProfileDraft;
  /** Which path actually produced this draft -- the frontend uses this to label AI-produced results distinctly rather than presenting them identically to the deterministic parser's output. */
  method: "llm" | "deterministic";
  /** Set only when method is "llm". */
  provider?: string;
}

export interface MatchedSkill {
  skillId: string;
  name: string;
  category: string;
  matchedText: string;
}

export type SeniorityLevel =
  | "intern"
  | "entry"
  | "mid"
  | "senior"
  | "staff"
  | "principal"
  | "lead"
  | "unknown";

export interface SeniorityInfo {
  level: SeniorityLevel;
  yearsRequired?: number;
}

export interface ExtractedRequirements {
  mustHaveSkills: MatchedSkill[];
  niceToHaveSkills: MatchedSkill[];
  keywords: string[];
  seniority: SeniorityInfo;
  title?: string;
}

export interface JobDescription {
  id: string;
  rawText: string;
  createdAt: string;
  requirements: ExtractedRequirements;
}

export interface JobDescriptionAnalysisResult {
  jobDescription: JobDescription;
  /** Whether an LLM enhanced the deterministic requirements extraction (merged in, not replaced -- see profileImportController for the equivalent pattern on resume import). */
  method: "llm" | "deterministic";
  provider?: string;
  /** Skill names the LLM noticed that don't resolve to anything in our curated taxonomy -- shown to the user as informational only, since they can't participate in skillId-keyed scoring without a taxonomy entry. */
  additionalSkillsDetected?: string[];
}

export type SkillMatchType = "must-have" | "nice-to-have" | "keyword" | "none";

export interface SkillScore {
  skillId: string;
  name: string;
  category: string;
  score: number;
  matchType: SkillMatchType;
}

export interface BulletScore {
  bulletId: string;
  score: number;
  matchedKeywords: string[];
}

export interface WorkExperienceScore {
  id: string;
  score: number;
  bulletScores: BulletScore[];
}

export interface ProjectScore {
  id: string;
  score: number;
  bulletScores: BulletScore[];
  matchedTech: string[];
}

export interface RelevanceResult {
  overallScore: number;
  mustHaveCoverage: number;
  niceToHaveCoverage: number;
  matchedMustHave: string[];
  missingMustHave: string[];
  matchedNiceToHave: string[];
  missingNiceToHave: string[];
  skillScores: SkillScore[];
  workExperienceScores: WorkExperienceScore[];
  projectScores: ProjectScore[];
}

export interface ItemSelection {
  id: string;
  selected: boolean;
}

export interface WorkExperienceSelection extends ItemSelection {
  bullets: ItemSelection[];
}

export interface ProjectSelection extends ItemSelection {
  bullets: ItemSelection[];
}

export interface SelectionState {
  jobDescriptionId: string;
  workExperience: WorkExperienceSelection[];
  projects: ProjectSelection[];
  skills: ItemSelection[];
}

export interface TailoredWorkExperience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  bullets: string[];
}

export interface TailoredProject {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  techStack: string[];
  bullets: string[];
}

export interface TailoredResume {
  contact: ContactInfo;
  summary: string;
  workExperience: TailoredWorkExperience[];
  projects: TailoredProject[];
  skills: Skill[];
  education: Education[];
  certifications: Certification[];
}

export interface ResumeVersion {
  id: string;
  jobDescriptionId: string;
  templateName: string;
  profileSnapshot: Profile;
  selection: SelectionState;
  overallScore: number;
  createdAt: string;
}

export type ScanSeverity = "high" | "medium" | "low";

export type ScanTargetType =
  | "contact"
  | "bullet"
  | "skill"
  | "workExperience"
  | "project"
  | "education"
  | "general";

export interface ScanSuggestion {
  id: string;
  severity: ScanSeverity;
  category: string;
  message: string;
  targetType: ScanTargetType;
  targetId?: string;
}

export interface ResumeScanResult {
  score: number;
  suggestions: ScanSuggestion[];
}

export interface CoverLetterContent {
  contact: ContactInfo;
  companyName?: string;
  hiringManagerName?: string;
  jobTitle?: string;
  openingParagraph: string;
  bodyParagraph: string;
  closingParagraph: string;
}

export type SkillValidationType = "unsubstantiated" | "missing-from-skills";

export interface SkillValidationFinding {
  id: string;
  type: SkillValidationType;
  skillName: string;
  message: string;
}

export interface SkillValidationResult {
  findings: SkillValidationFinding[];
}
