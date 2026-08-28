import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  scanResume,
  validateSkills,
  buildFullResume,
  RESUME_TEMPLATES,
  DEFAULT_RESUME_TEMPLATE_ID,
  type Profile,
  type ScanTargetType,
  type AiResumeSuggestion,
  type ResumeTemplateId,
} from "@resumebuilder/shared";
import { fetchProfile, saveProfile, importProfile, fetchResumeHealthAi, exportProfileUrl } from "../api/profileApi.js";
import { useAiMode } from "../shell/AiModeContext.js";
import { useNav } from "../shell/NavContext.js";
import { resolveTemplateComponent } from "../templates/registry.js";
import ContactForm from "../components/ContactForm.js";
import SummaryForm from "../components/SummaryForm.js";
import WorkExperienceForm from "../components/WorkExperienceForm.js";
import ProjectsForm from "../components/ProjectsForm.js";
import VolunteerWorkForm from "../components/VolunteerWorkForm.js";
import SkillsForm from "../components/SkillsForm.js";
import EducationForm from "../components/EducationForm.js";
import CertificationsForm from "../components/CertificationsForm.js";
import SimpleEntryForm from "../components/SimpleEntryForm.js";
import TagListForm from "../components/TagListForm.js";
import BulletListSection from "../components/BulletListSection.js";
import TestScoresForm from "../components/TestScoresForm.js";
import ReferencesForm from "../components/ReferencesForm.js";
import ScoreGauge from "../components/ScoreGauge.js";
import SectionNav from "../components/SectionNav.js";
import EditorToolbar from "../components/EditorToolbar.js";
import { useSetSidebar, useSetTopBarExtra } from "../shell/ShellContext.js";

type Status = "loading" | "ready" | "saving" | "saved" | "error";
type ImportStatus = "idle" | "importing" | "imported" | "error";
type AiHealthStatus = "idle" | "loading" | "loaded" | "error";

function targetLabel(targetType: ScanTargetType): string {
  switch (targetType) {
    case "contact":
      return "Contact";
    case "bullet":
      return "Bullet";
    case "skill":
      return "Skills";
    case "workExperience":
      return "Work Experience";
    case "project":
      return "Projects";
    case "education":
      return "Education";
    case "general":
      return "Overall";
  }
}

const SECTION_ITEMS = [
  { id: "import", label: "Import from Resume", icon: "⬆️", group: "Insights" },
  { id: "resume-health", label: "Resume Health", icon: "❤️", group: "Insights" },
  { id: "skill-validation", label: "Skill Validation", icon: "✅", group: "Insights" },
  { id: "contact-info", label: "Contact Info", icon: "👤", group: "Profile" },
  { id: "summary", label: "Summary", icon: "📝", group: "Profile" },
  { id: "work-experience", label: "Work Experience", icon: "💼", group: "Profile" },
  { id: "projects", label: "Projects", icon: "🛠️", group: "Profile" },
  { id: "volunteer-work", label: "Volunteer Work", icon: "🤝", group: "Profile" },
  { id: "skills", label: "Skills", icon: "✨", group: "Profile" },
  { id: "education", label: "Education", icon: "🎓", group: "Profile" },
  { id: "certifications", label: "Certifications", icon: "🏅", group: "Profile" },
  { id: "research-experience", label: "Research Experience", icon: "🔬", group: "Profile" },
  { id: "leadership", label: "Leadership", icon: "🚀", group: "Profile" },
  { id: "extra-curricular", label: "Extra Curricular Activities", icon: "🎯", group: "Profile" },
  { id: "publications", label: "Publications", icon: "📖", group: "Profile" },
  { id: "publications-abstract", label: "Publications Abstract", icon: "📄", group: "Profile" },
  { id: "languages", label: "Languages", icon: "🌐", group: "Profile" },
  { id: "associations", label: "Associations", icon: "🏛️", group: "Profile" },
  { id: "hobbies-interests", label: "Hobbies & Interests", icon: "🎨", group: "Profile" },
  { id: "awards-honors", label: "Awards & Honors", icon: "🏆", group: "Profile" },
  { id: "conferences-presentations", label: "Conferences/Presentations", icon: "🎤", group: "Profile" },
  { id: "courses", label: "Courses", icon: "📚", group: "Profile" },
  { id: "patents", label: "Patents", icon: "💡", group: "Profile" },
  { id: "test-scores", label: "Test Scores", icon: "📊", group: "Profile" },
  { id: "references", label: "References", icon: "👥", group: "Profile" },
] as const;

const DEFAULT_SECTION_ID = "contact-info";

/** Static, evergreen coaching tips shown as an inline callout at the top of a section -- not derived from the user's current data (unlike Resume Health's suggestions), so they're always relevant even on a blank section. */
const SECTION_TIPS: Partial<Record<string, string>> = {
  summary: 'Keep it to 2-3 sentences -- lead with your strongest, most specific achievement.',
  "work-experience": 'Quantify results with numbers, e.g. "increased conversion by 18%."',
  projects: "Mention the tech stack and a measurable outcome or scale, not just what it does.",
  skills: "List skills relevant to the roles you're targeting -- specific tools beat generic buzzwords.",
  "volunteer-work": "Treat it like work experience -- lead with impact, not just a list of duties.",
};

interface ProfileEditorProps {
  initialTemplateId?: ResumeTemplateId;
}

export default function ProfileEditor({ initialTemplateId }: ProfileEditorProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [activeSectionId, setActiveSectionId] = useState<string>(DEFAULT_SECTION_ID);
  const [sectionSearch, setSectionSearch] = useState("");
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const [importMethod, setImportMethod] = useState<"llm" | "deterministic" | null>(null);
  const [aiHealthStatus, setAiHealthStatus] = useState<AiHealthStatus>("idle");
  const [aiHealthStrengths, setAiHealthStrengths] = useState<string[]>([]);
  const [aiHealthSuggestions, setAiHealthSuggestions] = useState<AiResumeSuggestion[]>([]);
  const [aiHealthAutoTriggered, setAiHealthAutoTriggered] = useState(false);
  const [templateId, setTemplateId] = useState<ResumeTemplateId>(initialTemplateId ?? DEFAULT_RESUME_TEMPLATE_ID);
  const [hoveredTemplateId, setHoveredTemplateId] = useState<ResumeTemplateId | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enabled: aiModeEnabled } = useAiMode();
  const { navigate } = useNav();

  useEffect(() => {
    fetchProfile()
      .then((p) => {
        setProfile(p);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile) return;
    setStatus("saving");
    try {
      const saved = await saveProfile(profile);
      setProfile(saved);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [profile]);

  async function handleImportFile(file: File) {
    if (!profile) return;
    setImportStatus("importing");
    setImportError(null);
    try {
      const { draft, method } = await importProfile(file);
      const merged = { ...profile, ...draft };
      setProfile(merged);
      setImportMethod(method);
      setImportStatus("imported");
      // Auto-grade the freshly-parsed data immediately, in AI mode -- the
      // point of attaching a resume is to see how it reads right away, not
      // to require a second manual click. Grades the in-memory merged
      // profile directly (not yet saved), so it reflects what was just
      // imported rather than stale database content.
      if (aiModeEnabled) {
        setAiHealthAutoTriggered(true);
        await handleGetAiFeedback(merged);
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import resume.");
      setImportStatus("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleGetAiFeedback(overrideProfile?: Profile) {
    setAiHealthStatus("loading");
    try {
      const { strengths, suggestions } = await fetchResumeHealthAi(overrideProfile ?? profile ?? undefined);
      setAiHealthStrengths(strengths);
      setAiHealthSuggestions(suggestions);
      setAiHealthStatus("loaded");
    } catch {
      setAiHealthStatus("error");
    }
  }

  // Computed here (not just after the loading guard below) so the sidebar's
  // persistent score widget can show it on every section, not only when
  // "Resume Health" happens to be the active one -- nullable since profile
  // may not have loaded yet, handled with a plain conditional (not a hook),
  // so this doesn't affect hook call order. Memoized: both functions return
  // a fresh object every call, and an unmemoized `scan` sits in sidebarNode's
  // useMemo deps below -- a new reference every render would recompute
  // sidebarNode every render, which useSetSidebar pushes into shell state,
  // triggering another render, in an infinite loop ("Maximum update depth
  // exceeded").
  const scan = useMemo(() => (profile ? scanResume(profile) : null), [profile]);
  const skillValidation = useMemo(() => (profile ? validateSkills(profile) : null), [profile]);

  const filteredSectionItems = useMemo(
    () =>
      sectionSearch.trim()
        ? SECTION_ITEMS.filter((i) => i.label.toLowerCase().includes(sectionSearch.trim().toLowerCase()))
        : SECTION_ITEMS,
    [sectionSearch]
  );

  const sidebarNode = useMemo(
    () => (
      <>
        <input
          className="section-search"
          type="search"
          placeholder="Search sections"
          value={sectionSearch}
          onChange={(e) => setSectionSearch(e.target.value)}
        />
        {["Insights", "Profile"].map((group) => {
          const items = filteredSectionItems.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              <div className="section-nav-label-group">{group}</div>
              <SectionNav items={items} activeId={activeSectionId} onSelect={setActiveSectionId} />
            </div>
          );
        })}
        {filteredSectionItems.length === 0 && <p className="status section-search-empty">No sections match.</p>}

        {scan && (
          <div className="sidebar-score-widget">
            <div className="sidebar-score-header">
              <span>RESUME SCORE</span>
              <span className="sidebar-score-value">{scan.score}%</span>
            </div>
            <div className="sidebar-score-bar">
              <div className="sidebar-score-bar-fill" style={{ width: `${scan.score}%` }} />
            </div>
            {scan.suggestions.length > 0 && (
              <p className="sidebar-score-tip">{scan.suggestions[0].message}</p>
            )}
          </div>
        )}
      </>
    ),
    [activeSectionId, sectionSearch, filteredSectionItems, scan]
  );
  useSetSidebar(sidebarNode);

  const topBarExtraNode = useMemo(
    () => (
      <>
        <button
          type="button"
          className="editor-toolbar-tool"
          onClick={() => navigate({ page: "editor-jd" })}
          title="Generate a cover letter for a specific job"
        >
          ✉️ AI Cover Letter
        </button>
        <button
          type="button"
          className="editor-toolbar-tool"
          onClick={() => setActiveSectionId("import")}
          title="Import from an existing resume file"
        >
          ⬆️ Import
        </button>
        <div className="topbar-download-menu">
          <button
            type="button"
            className="editor-toolbar-tool"
            onClick={() => setDownloadMenuOpen((open) => !open)}
            title="Download this profile as a resume"
          >
            ⬇️ Download
          </button>
          {downloadMenuOpen && (
            <div className="topbar-download-options" onMouseLeave={() => setDownloadMenuOpen(false)}>
              <a
                href={exportProfileUrl("pdf", templateId)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setDownloadMenuOpen(false)}
              >
                PDF
              </a>
              <a
                href={exportProfileUrl("docx", templateId)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setDownloadMenuOpen(false)}
              >
                DOCX
              </a>
            </div>
          )}
        </div>
        <span className="status">
          {status === "saved" && "Saved"}
          {status === "error" && "Something went wrong"}
        </span>
        <button className="primary" onClick={handleSave} disabled={status === "saving" || !profile}>
          {status === "saving" ? "Saving…" : "Save"}
        </button>
      </>
    ),
    [status, profile, handleSave, downloadMenuOpen, templateId, navigate]
  );
  useSetTopBarExtra(topBarExtraNode);

  if (status === "loading") return <div className="app">Loading profile…</div>;
  if (!profile) return <div className="app">Failed to load profile.</div>;
  // Separately-typed (non-nullable) bindings for renderActiveSection below:
  // it's a nested function, so TS's null-narrowing from the guards above
  // doesn't carry into its closure the way it does within this same scope.
  // scan/skillValidation are guaranteed non-null here too (same `profile`
  // check they were derived from above), just not provably so to TS.
  const currentProfile: Profile = profile;
  const currentScan = scan as NonNullable<typeof scan>;
  const currentSkillValidation = skillValidation as NonNullable<typeof skillValidation>;

  const activeTemplateId = hoveredTemplateId ?? templateId;
  const PreviewTemplate = resolveTemplateComponent(activeTemplateId);

  const activeIndex = SECTION_ITEMS.findIndex((i) => i.id === activeSectionId);
  const prevItem = activeIndex > 0 ? SECTION_ITEMS[activeIndex - 1] : null;
  const nextItem = activeIndex >= 0 && activeIndex < SECTION_ITEMS.length - 1 ? SECTION_ITEMS[activeIndex + 1] : null;

  function renderActiveSection() {
    switch (activeSectionId) {
      case "import":
        return (
          <section className="form-section" id="import">
            <h2>Import from Resume</h2>
            <p className="status">
              Best-effort, rule-based parsing of a .pdf or .docx resume — it will misparse some layouts. Nothing is
              saved until you review the form below and click Save.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
              }}
            />
            {importStatus === "importing" && <p className="status">Parsing…</p>}
            {importStatus === "imported" && (
              <p className="status">
                {importMethod === "llm" ? (
                  <span className="pill pill-ai">AI-parsed</span>
                ) : (
                  <span className="pill pill-nice">Rule-based parse</span>
                )}{" "}
                — review and correct the fields on the other sections before saving.
              </p>
            )}
            {importStatus === "error" && <p className="status">{importError}</p>}
            {importStatus === "imported" && !aiModeEnabled && (
              <p className="status">
                Switch to AI Mode before importing to get an automatic strengths/weaknesses grade on the parsed
                resume.
              </p>
            )}
          </section>
        );

      case "resume-health":
        return (
          <section className="form-section" id="resume-health">
            <h2>Resume Health</h2>
            <p className="status">Rule-based checks, recomputed live as you edit — no AI involved.</p>
            <div className="score-card-top">
              <ScoreGauge score={currentScan.score} />
              <div className="scan-summary">
                <p>
                  {currentScan.suggestions.length === 0
                    ? "No suggestions — this profile looks solid."
                    : `${currentScan.suggestions.length} suggestion${currentScan.suggestions.length === 1 ? "" : "s"} to strengthen this resume.`}
                </p>
              </div>
            </div>
            {currentScan.suggestions.length > 0 && (
              <ul className="suggestion-list">
                {currentScan.suggestions.map((s) => (
                  <li key={s.id} className="suggestion">
                    <span
                      className={`suggestion-severity-dot suggestion-severity-dot-${s.severity}`}
                      aria-hidden="true"
                    />
                    <div className="suggestion-body">
                      <span className="suggestion-message">{s.message}</span>
                      <span className="pill pill-nice suggestion-category-pill">{targetLabel(s.targetType)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="ai-action-cta">
              <button
                type="button"
                className="secondary"
                onClick={() => handleGetAiFeedback()}
                disabled={!aiModeEnabled || aiHealthStatus === "loading"}
                title={aiModeEnabled ? undefined : "Switch to AI Mode in the header to use this"}
              >
                {aiHealthStatus === "loading" ? "Getting AI feedback…" : "Get AI writing feedback"}
              </button>
              {aiHealthStatus === "error" && <span className="status">AI feedback isn't available right now.</span>}
            </div>

            {aiHealthStatus === "loaded" && (
              <div className="ai-suggestions">
                <p className="status">
                  {aiHealthAutoTriggered ? "Auto-graded right after import — " : ""}
                  Qualitative feedback from an AI model — informational only, it never affects the score above.
                </p>

                {aiHealthStrengths.length > 0 && (
                  <>
                    <p className="ai-suggestions-subhead">Strengths</p>
                    <ul className="suggestion-list">
                      {aiHealthStrengths.map((s, i) => (
                        <li key={i} className="suggestion">
                          <span className="suggestion-severity-dot suggestion-severity-dot-strength" aria-hidden="true" />
                          <div className="suggestion-body">
                            <span className="suggestion-message">{s}</span>
                            <span className="pill pill-ai suggestion-category-pill">AI</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {aiHealthSuggestions.length > 0 && (
                  <>
                    <p className="ai-suggestions-subhead">Suggested improvements</p>
                    <ul className="suggestion-list">
                      {aiHealthSuggestions.map((s) => (
                        <li key={s.id} className="suggestion">
                          <span className="suggestion-severity-dot suggestion-severity-dot-ai" aria-hidden="true" />
                          <div className="suggestion-body">
                            <span className="suggestion-message">{s.message}</span>
                            <span className="pill pill-ai suggestion-category-pill">AI</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {aiHealthStrengths.length === 0 && aiHealthSuggestions.length === 0 && (
                  <p className="status">No additional feedback — this profile reads well.</p>
                )}
              </div>
            )}
          </section>
        );

      case "skill-validation":
        return (
          <section className="form-section" id="skill-validation">
            <h2>Skill Validation</h2>
            <p className="status">
              Cross-references your listed skills against the rest of your resume — keyword presence only, not a
              judgment of proficiency.
            </p>
            {currentSkillValidation.findings.length === 0 ? (
              <p className="status">No findings.</p>
            ) : (
              <ul className="suggestion-list">
                {currentSkillValidation.findings.map((f) => (
                  <li key={f.id} className="suggestion">
                    <span
                      className={`suggestion-severity-dot suggestion-severity-dot-${
                        f.type === "unsubstantiated" ? "medium" : "low"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="suggestion-body">
                      <span className="suggestion-message">{f.message}</span>
                      <span className="pill pill-nice suggestion-category-pill">
                        {f.type === "unsubstantiated" ? "Unsubstantiated" : "Not listed"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );

      case "contact-info":
        return <ContactForm contact={currentProfile.contact} onChange={(contact) => setProfile({ ...currentProfile, contact })} />;

      case "summary":
        return <SummaryForm summary={currentProfile.summary} onChange={(summary) => setProfile({ ...currentProfile, summary })} />;

      case "work-experience":
        return (
          <WorkExperienceForm
            entries={currentProfile.workExperience}
            onChange={(workExperience) => setProfile({ ...currentProfile, workExperience })}
          />
        );

      case "projects":
        return <ProjectsForm entries={currentProfile.projects} onChange={(projects) => setProfile({ ...currentProfile, projects })} />;

      case "volunteer-work":
        return (
          <VolunteerWorkForm
            entries={currentProfile.volunteerWork}
            onChange={(volunteerWork) => setProfile({ ...currentProfile, volunteerWork })}
          />
        );

      case "skills":
        return <SkillsForm skills={currentProfile.skills} onChange={(skills) => setProfile({ ...currentProfile, skills })} />;

      case "education":
        return (
          <EducationForm entries={currentProfile.education} onChange={(education) => setProfile({ ...currentProfile, education })} />
        );

      case "certifications":
        return (
          <CertificationsForm
            entries={currentProfile.certifications}
            onChange={(certifications) => setProfile({ ...currentProfile, certifications })}
          />
        );

      case "research-experience":
        return (
          <SimpleEntryForm
            title="Research Experience"
            entries={currentProfile.researchExperience}
            onChange={(researchExperience) => setProfile({ ...currentProfile, researchExperience })}
            subtitleLabel="Institution/Lab"
          />
        );

      case "leadership":
        return (
          <SimpleEntryForm
            title="Leadership"
            entries={currentProfile.leadership}
            onChange={(leadership) => setProfile({ ...currentProfile, leadership })}
          />
        );

      case "extra-curricular":
        return (
          <SimpleEntryForm
            title="Extra Curricular Activities"
            entries={currentProfile.extraCurricular}
            onChange={(extraCurricular) => setProfile({ ...currentProfile, extraCurricular })}
            addLabel="Add Activity"
          />
        );

      case "publications":
        return (
          <BulletListSection
            title="Publications"
            helpText="One entry per publication -- title, authors, venue, however you'd cite it."
            bullets={currentProfile.publications}
            onChange={(publications) => setProfile({ ...currentProfile, publications })}
          />
        );

      case "publications-abstract":
        return (
          <BulletListSection
            title="Publications Abstract"
            helpText="Short abstracts for the publications above, if you'd like to include them."
            bullets={currentProfile.publicationsAbstract}
            onChange={(publicationsAbstract) => setProfile({ ...currentProfile, publicationsAbstract })}
          />
        );

      case "languages":
        return (
          <TagListForm
            title="Languages"
            tags={currentProfile.languages}
            onChange={(languages) => setProfile({ ...currentProfile, languages })}
            placeholder="e.g. Spanish (fluent)"
          />
        );

      case "associations":
        return (
          <SimpleEntryForm
            title="Associations"
            entries={currentProfile.associations}
            onChange={(associations) => setProfile({ ...currentProfile, associations })}
            titleLabel="Role"
            subtitleLabel="Organization"
          />
        );

      case "hobbies-interests":
        return (
          <TagListForm
            title="Hobbies & Interests"
            tags={currentProfile.hobbiesAndInterests}
            onChange={(hobbiesAndInterests) => setProfile({ ...currentProfile, hobbiesAndInterests })}
            placeholder="e.g. Rock climbing"
          />
        );

      case "awards-honors":
        return (
          <SimpleEntryForm
            title="Awards & Honors"
            entries={currentProfile.awardsAndHonors}
            onChange={(awardsAndHonors) => setProfile({ ...currentProfile, awardsAndHonors })}
            titleLabel="Award"
            subtitleLabel="Issued By"
            addLabel="Add Award"
          />
        );

      case "conferences-presentations":
        return (
          <SimpleEntryForm
            title="Conferences/Presentations"
            entries={currentProfile.conferencesPresentations}
            onChange={(conferencesPresentations) => setProfile({ ...currentProfile, conferencesPresentations })}
            titleLabel="Talk/Presentation"
            subtitleLabel="Conference/Event"
          />
        );

      case "courses":
        return (
          <SimpleEntryForm
            title="Courses"
            entries={currentProfile.courses}
            onChange={(courses) => setProfile({ ...currentProfile, courses })}
            subtitleLabel="Provider/Institution"
            addLabel="Add Course"
            showDates={false}
          />
        );

      case "patents":
        return (
          <SimpleEntryForm
            title="Patents"
            entries={currentProfile.patents}
            onChange={(patents) => setProfile({ ...currentProfile, patents })}
            subtitleLabel="Patent Number"
            addLabel="Add Patent"
          />
        );

      case "test-scores":
        return (
          <TestScoresForm entries={currentProfile.testScores} onChange={(testScores) => setProfile({ ...currentProfile, testScores })} />
        );

      case "references":
        return (
          <ReferencesForm entries={currentProfile.references} onChange={(references) => setProfile({ ...currentProfile, references })} />
        );

      default:
        return null;
    }
  }

  return (
    <div className="app editor-with-preview">
      <div className="editor-form-column">
        <h1 className="page-title">Master Profile</h1>
        <EditorToolbar
          onPreview={() => setPreviewOpen(true)}
          onAiReview={() => {
            setActiveSectionId("resume-health");
            if (aiModeEnabled) handleGetAiFeedback();
          }}
        />

        {SECTION_TIPS[activeSectionId] && (
          <div className="ai-tip-callout">
            <span className="ai-tip-icon" aria-hidden="true">
              ✨
            </span>
            <span>
              <strong>AI tip</strong> — {SECTION_TIPS[activeSectionId]}
            </span>
          </div>
        )}

        {renderActiveSection()}

        <div className="wizard-nav-bars">
          {prevItem && (
            <button type="button" className="wizard-nav-bar wizard-back-bar" onClick={() => setActiveSectionId(prevItem.id)}>
              <span className="wizard-nav-arrow" aria-hidden="true">
                ←
              </span>
              <span className="wizard-nav-text">
                <span className="wizard-nav-caption">Back</span>
                <span className="wizard-nav-title">
                  {prevItem.icon} {prevItem.label}
                </span>
              </span>
            </button>
          )}
          {nextItem ? (
            <button type="button" className="wizard-nav-bar wizard-next-bar" onClick={() => setActiveSectionId(nextItem.id)}>
              <span className="wizard-nav-text">
                <span className="wizard-nav-caption">Next</span>
                <span className="wizard-nav-title">
                  {nextItem.icon} {nextItem.label}
                </span>
              </span>
              <span className="wizard-nav-arrow" aria-hidden="true">
                →
              </span>
            </button>
          ) : (
            <div className="wizard-finish-bar">
              <span>🎉 That's every section.</span>
              <button type="button" className="link-button" onClick={() => setActiveSectionId("resume-health")}>
                Check your Resume Health
              </button>
              <span>or hit Save above.</span>
            </div>
          )}
        </div>
      </div>

      <aside className="editor-preview-column">
        <div className="template-picker">
          {RESUME_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={templateId === t.id ? "template-option active" : "template-option"}
              onClick={() => setTemplateId(t.id)}
              onMouseEnter={() => setHoveredTemplateId(t.id)}
              onMouseLeave={() => setHoveredTemplateId(null)}
              title={t.description}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="resume-preview-frame editor-preview-frame">
          <div className="editor-preview-scale-outer">
            <div className="editor-preview-scale-inner">
              <PreviewTemplate resume={buildFullResume(currentProfile)} />
            </div>
          </div>
        </div>
      </aside>

      {previewOpen && (
        <div className="preview-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="preview-overlay-panel" onClick={(e) => e.stopPropagation()}>
            <div className="preview-overlay-header">
              <div className="template-picker">
                {RESUME_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={templateId === t.id ? "template-option active" : "template-option"}
                    onClick={() => setTemplateId(t.id)}
                    onMouseEnter={() => setHoveredTemplateId(t.id)}
                    onMouseLeave={() => setHoveredTemplateId(null)}
                    title={t.description}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <button type="button" className="shell-close" onClick={() => setPreviewOpen(false)} aria-label="Close preview">
                ✕
              </button>
            </div>
            <div className="preview-overlay-body">
              <PreviewTemplate resume={buildFullResume(currentProfile)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
