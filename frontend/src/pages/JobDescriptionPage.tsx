import { useEffect, useMemo, useState } from "react";
import {
  scoreProfile,
  buildTailoredResume,
  buildCoverLetter,
  type JobDescription,
  type RelevanceResult,
  type Profile,
  type SelectionState,
  type ItemSelection,
} from "@resumebuilder/shared";
import { submitJobDescription, fetchJobDescriptions } from "../api/jobDescriptionApi.js";
import { fetchRelevance } from "../api/relevanceApi.js";
import { fetchSelection } from "../api/selectionApi.js";
import { fetchProfile } from "../api/profileApi.js";
import { createResumeVersion } from "../api/resumeVersionApi.js";
import DraggableChecklist, { type ChecklistItem } from "../components/DraggableChecklist.js";
import ScoreGauge from "../components/ScoreGauge.js";
import CoverageBar from "../components/CoverageBar.js";
import SingleColumnResume from "../templates/SingleColumnResume.js";
import CoverLetterDoc from "../templates/CoverLetterDoc.js";
import { buildSelectedProfile } from "../utils/buildSelectedProfile.js";
import { API_BASE_URL } from "../api/config.js";
import SectionNav, { type SectionNavItem } from "../components/SectionNav.js";
import { useSetSidebar, useSetTopBarExtra } from "../shell/ShellContext.js";

type Status = "idle" | "analyzing" | "error";
type ScoreStatus = "idle" | "scoring" | "error";
type ExportFormat = "pdf" | "docx";
type ExportStatus = "idle" | `exporting-${ExportFormat}` | "error";
type CoverLetterExportStatus = "idle" | `exporting-${ExportFormat}` | "error";

function toggleItem<T extends ItemSelection>(items: T[], id: string): T[] {
  return items.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item));
}

function reorderItems<T extends ItemSelection>(items: T[], newOrderIds: string[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return newOrderIds.map((id) => byId.get(id)!);
}

function seniorityLabel(jd: JobDescription): string {
  const { level, yearsRequired } = jd.requirements.seniority;
  const parts: string[] = [];
  if (level !== "unknown") parts.push(level);
  if (yearsRequired !== undefined) parts.push(`${yearsRequired}+ yrs`);
  return parts.length > 0 ? parts.join(" · ") : "No signal detected";
}

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function JobDescriptionPage() {
  const [rawText, setRawText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<JobDescription | null>(null);
  const [history, setHistory] = useState<JobDescription[]>([]);
  const [scoreStatus, setScoreStatus] = useState<ScoreStatus>("idle");
  const [relevance, setRelevance] = useState<RelevanceResult | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [companyName, setCompanyName] = useState("");
  const [hiringManagerName, setHiringManagerName] = useState("");
  const [coverLetterExportStatus, setCoverLetterExportStatus] = useState<CoverLetterExportStatus>("idle");

  useEffect(() => {
    fetchJobDescriptions()
      .then(setHistory)
      .catch(() => {
        /* history is best-effort; ignore failure */
      });
  }, []);

  async function handleAnalyze() {
    if (!rawText.trim()) return;
    setStatus("analyzing");
    setRelevance(null);
    try {
      const jd = await submitJobDescription(rawText);
      setResult(jd);
      setHistory((prev) => [jd, ...prev]);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function handleScore() {
    if (!result) return;
    setScoreStatus("scoring");
    try {
      const [relevanceResult, selectionResult, profileResult] = await Promise.all([
        fetchRelevance(result.id),
        fetchSelection(result.id),
        fetchProfile(),
      ]);
      setRelevance(relevanceResult);
      setSelection(selectionResult);
      setProfile(profileResult);
      setScoreStatus("idle");
    } catch {
      setScoreStatus("error");
    }
  }

  async function handleExport(format: ExportFormat) {
    if (!result || !selection) return;
    setExportStatus(`exporting-${format}`);
    try {
      const version = await createResumeVersion(result.id, selection);
      window.open(`${API_BASE_URL}/resume-versions/${version.id}/${format}`, "_blank");
      setExportStatus("idle");
    } catch {
      setExportStatus("error");
    }
  }

  async function handleExportCoverLetter(format: ExportFormat) {
    if (!result || !selection) return;
    setCoverLetterExportStatus(`exporting-${format}`);
    try {
      const version = await createResumeVersion(result.id, selection);
      const params = new URLSearchParams();
      if (companyName.trim()) params.set("companyName", companyName.trim());
      if (hiringManagerName.trim()) params.set("hiringManagerName", hiringManagerName.trim());
      const query = params.toString();
      window.open(
        `${API_BASE_URL}/resume-versions/${version.id}/cover-letter/${format}${query ? `?${query}` : ""}`,
        "_blank"
      );
      setCoverLetterExportStatus("idle");
    } catch {
      setCoverLetterExportStatus("error");
    }
  }

  function toggleSkill(id: string) {
    setSelection((sel) => sel && { ...sel, skills: toggleItem(sel.skills, id) });
  }
  function reorderSkills(newOrder: string[]) {
    setSelection((sel) => sel && { ...sel, skills: reorderItems(sel.skills, newOrder) });
  }

  function toggleProject(id: string) {
    setSelection((sel) => sel && { ...sel, projects: toggleItem(sel.projects, id) });
  }
  function reorderProjects(newOrder: string[]) {
    setSelection((sel) => sel && { ...sel, projects: reorderItems(sel.projects, newOrder) });
  }
  function toggleProjectBullet(projectId: string, bulletId: string) {
    setSelection(
      (sel) =>
        sel && {
          ...sel,
          projects: sel.projects.map((p) =>
            p.id === projectId ? { ...p, bullets: toggleItem(p.bullets, bulletId) } : p
          ),
        }
    );
  }
  function reorderProjectBullets(projectId: string, newOrder: string[]) {
    setSelection(
      (sel) =>
        sel && {
          ...sel,
          projects: sel.projects.map((p) =>
            p.id === projectId ? { ...p, bullets: reorderItems(p.bullets, newOrder) } : p
          ),
        }
    );
  }

  function toggleWorkExperience(id: string) {
    setSelection((sel) => sel && { ...sel, workExperience: toggleItem(sel.workExperience, id) });
  }
  function reorderWorkExperience(newOrder: string[]) {
    setSelection((sel) => sel && { ...sel, workExperience: reorderItems(sel.workExperience, newOrder) });
  }
  function toggleWorkExperienceBullet(entryId: string, bulletId: string) {
    setSelection(
      (sel) =>
        sel && {
          ...sel,
          workExperience: sel.workExperience.map((w) =>
            w.id === entryId ? { ...w, bullets: toggleItem(w.bullets, bulletId) } : w
          ),
        }
    );
  }
  function reorderWorkExperienceBullets(entryId: string, newOrder: string[]) {
    setSelection(
      (sel) =>
        sel && {
          ...sel,
          workExperience: sel.workExperience.map((w) =>
            w.id === entryId ? { ...w, bullets: reorderItems(w.bullets, newOrder) } : w
          ),
        }
    );
  }

  function buildSkillItems(): ChecklistItem[] {
    if (!selection || !profile || !relevance) return [];
    const skillById = new Map(profile.skills.map((s) => [s.id, s]));
    const scoreById = new Map(relevance.skillScores.map((s) => [s.skillId, s.score]));
    return selection.skills.map((sel) => ({
      id: sel.id,
      label: skillById.get(sel.id)?.name ?? sel.id,
      sublabel: `${scoreById.get(sel.id) ?? 0}`,
      selected: sel.selected,
    }));
  }

  function buildProjectItems(): ChecklistItem[] {
    if (!selection || !profile || !relevance) return [];
    const projectById = new Map(profile.projects.map((p) => [p.id, p]));
    const scoreById = new Map(relevance.projectScores.map((p) => [p.id, p]));
    return selection.projects.map((sel) => ({
      id: sel.id,
      label: projectById.get(sel.id)?.name ?? sel.id,
      sublabel: `${scoreById.get(sel.id)?.score ?? 0}`,
      selected: sel.selected,
    }));
  }

  function buildProjectBulletItems(projectId: string): ChecklistItem[] {
    if (!selection || !profile || !relevance) return [];
    const proj = selection.projects.find((p) => p.id === projectId);
    const profileProject = profile.projects.find((p) => p.id === projectId);
    const scoreEntry = relevance.projectScores.find((p) => p.id === projectId);
    if (!proj || !profileProject) return [];
    const bulletById = new Map(profileProject.bullets.map((b) => [b.id, b]));
    const scoreById = new Map((scoreEntry?.bulletScores ?? []).map((b) => [b.bulletId, b.score]));
    return proj.bullets.map((b) => ({
      id: b.id,
      label: bulletById.get(b.id)?.text ?? b.id,
      sublabel: `${scoreById.get(b.id) ?? 0}`,
      selected: b.selected,
    }));
  }

  function buildWorkExperienceItems(): ChecklistItem[] {
    if (!selection || !profile || !relevance) return [];
    const entryById = new Map(profile.workExperience.map((w) => [w.id, w]));
    const scoreById = new Map(relevance.workExperienceScores.map((w) => [w.id, w.score]));
    return selection.workExperience.map((sel) => {
      const entry = entryById.get(sel.id);
      return {
        id: sel.id,
        label: entry ? `${entry.title} — ${entry.company}` : sel.id,
        sublabel: `${scoreById.get(sel.id) ?? 0}`,
        selected: sel.selected,
      };
    });
  }

  function computeTailoredRelevance(): RelevanceResult | null {
    if (!selection || !profile || !result) return null;
    return scoreProfile(buildSelectedProfile(profile, selection), result.requirements);
  }

  function buildWorkExperienceBulletItems(entryId: string): ChecklistItem[] {
    if (!selection || !profile || !relevance) return [];
    const sel = selection.workExperience.find((w) => w.id === entryId);
    const profileEntry = profile.workExperience.find((w) => w.id === entryId);
    const scoreEntry = relevance.workExperienceScores.find((w) => w.id === entryId);
    if (!sel || !profileEntry) return [];
    const bulletById = new Map(profileEntry.bullets.map((b) => [b.id, b]));
    const scoreById = new Map((scoreEntry?.bulletScores ?? []).map((b) => [b.bulletId, b.score]));
    return sel.bullets.map((b) => ({
      id: b.id,
      label: bulletById.get(b.id)?.text ?? b.id,
      sublabel: `${scoreById.get(b.id) ?? 0}`,
      selected: b.selected,
    }));
  }

  function computeCoverLetter() {
    if (!selection || !profile || !result || !tailoredRelevance) return null;
    return buildCoverLetter(profile, result, tailoredRelevance, selection, {
      companyName: companyName.trim() || undefined,
      hiringManagerName: hiringManagerName.trim() || undefined,
    });
  }

  const tailoredRelevance = computeTailoredRelevance();
  const coverLetter = computeCoverLetter();

  // computeTailoredRelevance()/computeCoverLetter() build a fresh object every
  // render, so the booleans below (not the objects themselves) are what must
  // drive memoization -- otherwise sectionItems, and the sidebar/top-bar JSX
  // built from it, would get a new identity every render regardless of
  // whether anything actually changed, and the useSetSidebar/useSetTopBarExtra
  // effects downstream would never stop re-firing.
  const hasResult = !!result;
  const hasRelevance = !!relevance;
  const hasSelection = !!selection;
  const hasTailoredRelevance = !!tailoredRelevance;
  const hasCoverLetter = !!coverLetter;
  const hasHistory = history.length > 0;

  const sectionItems: SectionNavItem[] = useMemo(
    () => [
      { id: "job-description", label: "Job Description", icon: "📋" },
      {
        id: "requirements",
        label: "Requirements",
        icon: "🔍",
        disabled: !hasResult,
        disabledHint: "Analyze a job description first",
      },
      {
        id: "build-resume",
        label: "Build Resume",
        icon: "🧩",
        disabled: !hasRelevance,
        disabledHint: "Score against your profile first",
      },
      {
        id: "resume-preview",
        label: "Resume Preview",
        icon: "📄",
        disabled: !hasSelection,
        disabledHint: "Score against your profile first",
      },
      {
        id: "ats-score",
        label: "ATS Score",
        icon: "📊",
        disabled: !hasTailoredRelevance,
        disabledHint: "Score against your profile first",
      },
      {
        id: "cover-letter",
        label: "Cover Letter",
        icon: "✉️",
        disabled: !hasCoverLetter,
        disabledHint: "Score against your profile first",
      },
      { id: "history", label: "History", icon: "🕘", disabled: !hasHistory, disabledHint: "No past job descriptions yet" },
    ],
    [hasResult, hasRelevance, hasSelection, hasTailoredRelevance, hasCoverLetter, hasHistory]
  );

  const sidebarNode = useMemo(() => <SectionNav items={sectionItems} />, [sectionItems]);
  useSetSidebar(sidebarNode);

  // Cover Letter gets a permanent, always-visible action in the top bar --
  // it used to only exist after scrolling past three other gated sections,
  // which made it effectively undiscoverable.
  const topBarExtraNode = useMemo(
    () => (
      <button
        className={hasCoverLetter ? "primary" : ""}
        onClick={() => jumpTo("cover-letter")}
        disabled={!hasCoverLetter}
        title={!hasCoverLetter ? "Score against your profile to unlock the cover letter" : undefined}
      >
        ✉️ Cover Letter
      </button>
    ),
    [hasCoverLetter]
  );
  useSetTopBarExtra(topBarExtraNode);

  return (
    <div className="app">
      <h1 className="page-title">Tailor Your Resume</h1>

      <section className="form-section" id="job-description">
        <h2>Paste a Job Description</h2>
        <div className="field">
          <textarea
            rows={12}
            placeholder="Paste the full job description here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>
        <button className="primary" onClick={handleAnalyze} disabled={status === "analyzing"}>
          {status === "analyzing" ? "Analyzing…" : "Analyze"}
        </button>
        {status === "error" && <span className="status">Something went wrong</span>}
      </section>

      {result && (
        <section className="form-section" id="requirements">
          <h2>Extracted Requirements</h2>
          <p>
            <strong>Seniority:</strong> {seniorityLabel(result)}
          </p>
          <p>
            <strong>Must-have skills</strong>
          </p>
          <div className="pill-row">
            {result.requirements.mustHaveSkills.length === 0 && <span className="status">None detected</span>}
            {result.requirements.mustHaveSkills.map((s) => (
              <span className="pill pill-must" key={s.skillId}>
                {s.name}
              </span>
            ))}
          </div>
          <p>
            <strong>Nice-to-have skills</strong>
          </p>
          <div className="pill-row">
            {result.requirements.niceToHaveSkills.length === 0 && <span className="status">None detected</span>}
            {result.requirements.niceToHaveSkills.map((s) => (
              <span className="pill pill-nice" key={s.skillId}>
                {s.name}
              </span>
            ))}
          </div>
          <button onClick={handleScore} disabled={scoreStatus === "scoring"}>
            {scoreStatus === "scoring" ? "Scoring…" : "Score against my profile"}
          </button>
          {scoreStatus === "error" && <span className="status">Something went wrong</span>}
        </section>
      )}

      {selection && profile && relevance && (
        <section className="form-section" id="build-resume">
          <h2>Build Your Resume</h2>
          <p className="status">
            Auto-selected and ranked for this job. Drag to reorder, use the checkbox to include/exclude.
          </p>

          <h3>Skills</h3>
          <DraggableChecklist items={buildSkillItems()} onToggle={toggleSkill} onReorder={reorderSkills} />

          <h3>Projects</h3>
          <DraggableChecklist
            items={buildProjectItems()}
            onToggle={toggleProject}
            onReorder={reorderProjects}
            renderExtra={(item) => (
              <div className="nested-checklist">
                <DraggableChecklist
                  items={buildProjectBulletItems(item.id)}
                  onToggle={(bulletId) => toggleProjectBullet(item.id, bulletId)}
                  onReorder={(newOrder) => reorderProjectBullets(item.id, newOrder)}
                />
              </div>
            )}
          />

          <h3>Work Experience</h3>
          <DraggableChecklist
            items={buildWorkExperienceItems()}
            onToggle={toggleWorkExperience}
            onReorder={reorderWorkExperience}
            renderExtra={(item) => (
              <div className="nested-checklist">
                <DraggableChecklist
                  items={buildWorkExperienceBulletItems(item.id)}
                  onToggle={(bulletId) => toggleWorkExperienceBullet(item.id, bulletId)}
                  onReorder={(newOrder) => reorderWorkExperienceBullets(item.id, newOrder)}
                />
              </div>
            )}
          />
        </section>
      )}

      {selection && profile && (
        <section className="form-section" id="resume-preview">
          <h2>Resume Preview (Single-Column ATS-Safe)</h2>
          <div className="resume-preview-frame">
            <SingleColumnResume resume={buildTailoredResume(profile, selection)} />
          </div>
        </section>
      )}

      {tailoredRelevance && (
        <section className="form-section" id="ats-score">
          <h2>ATS Score Preview</h2>
          <p className="status">
            Reflects exactly what's currently selected — updates live as you toggle or reorder above.
          </p>

          <div className="score-card-top">
            <ScoreGauge score={tailoredRelevance.overallScore} />
            <div className="coverage-bars">
              <CoverageBar label="Must-have coverage" value={tailoredRelevance.mustHaveCoverage} />
              <CoverageBar label="Nice-to-have coverage" value={tailoredRelevance.niceToHaveCoverage} />
            </div>
          </div>

          <p className="score-breakdown-label">Matched must-haves</p>
          <div className="pill-row">
            {tailoredRelevance.matchedMustHave.length === 0 && <span className="status">None</span>}
            {tailoredRelevance.matchedMustHave.map((name) => (
              <span className="pill pill-match" key={name}>
                {name}
              </span>
            ))}
          </div>
          <p className="score-breakdown-label">Missing must-haves</p>
          <div className="pill-row">
            {tailoredRelevance.missingMustHave.length === 0 && <span className="status">None</span>}
            {tailoredRelevance.missingMustHave.map((name) => (
              <span className="pill pill-missing" key={name}>
                {name}
              </span>
            ))}
          </div>
          <p className="score-breakdown-label">Matched nice-to-haves</p>
          <div className="pill-row">
            {tailoredRelevance.matchedNiceToHave.length === 0 && <span className="status">None</span>}
            {tailoredRelevance.matchedNiceToHave.map((name) => (
              <span className="pill pill-match" key={name}>
                {name}
              </span>
            ))}
          </div>
          <p className="score-breakdown-label">Missing nice-to-haves</p>
          <div className="pill-row">
            {tailoredRelevance.missingNiceToHave.length === 0 && <span className="status">None</span>}
            {tailoredRelevance.missingNiceToHave.map((name) => (
              <span className="pill pill-missing" key={name}>
                {name}
              </span>
            ))}
          </div>
          <div className="export-button-row">
            <button
              className="primary"
              onClick={() => handleExport("pdf")}
              disabled={exportStatus !== "idle" && exportStatus !== "error"}
            >
              {exportStatus === "exporting-pdf" ? "Exporting…" : "Export as PDF"}
            </button>
            <button
              onClick={() => handleExport("docx")}
              disabled={exportStatus !== "idle" && exportStatus !== "error"}
            >
              {exportStatus === "exporting-docx" ? "Exporting…" : "Export as DOCX"}
            </button>
          </div>
          {exportStatus === "error" && <span className="status">Something went wrong</span>}
        </section>
      )}

      {coverLetter && (
        <section className="form-section" id="cover-letter">
          <h2>Cover Letter</h2>
          <p className="status">
            Templated from your matched skills and top selected achievement — no AI, fully derived from the data
            above.
          </p>
          <div className="field-row">
            <div className="field">
              <label>Company name (optional)</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="field">
              <label>Hiring manager name (optional)</label>
              <input value={hiringManagerName} onChange={(e) => setHiringManagerName(e.target.value)} />
            </div>
          </div>
          <div className="resume-preview-frame">
            <CoverLetterDoc letter={coverLetter} />
          </div>
          <div className="export-button-row">
            <button
              className="primary"
              onClick={() => handleExportCoverLetter("pdf")}
              disabled={coverLetterExportStatus !== "idle" && coverLetterExportStatus !== "error"}
            >
              {coverLetterExportStatus === "exporting-pdf" ? "Exporting…" : "Export as PDF"}
            </button>
            <button
              onClick={() => handleExportCoverLetter("docx")}
              disabled={coverLetterExportStatus !== "idle" && coverLetterExportStatus !== "error"}
            >
              {coverLetterExportStatus === "exporting-docx" ? "Exporting…" : "Export as DOCX"}
            </button>
          </div>
          {coverLetterExportStatus === "error" && <span className="status">Something went wrong</span>}
        </section>
      )}

      {history.length > 0 && (
        <section className="form-section" id="history">
          <h2>History</h2>
          {history.map((jd) => (
            <div className="entry-card" key={jd.id}>
              <div className="status">{new Date(jd.createdAt).toLocaleString()}</div>
              <div>{jd.rawText.slice(0, 140)}{jd.rawText.length > 140 ? "…" : ""}</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
