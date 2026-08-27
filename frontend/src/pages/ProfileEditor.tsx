import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  scanResume,
  validateSkills,
  type Profile,
  type ScanTargetType,
  type AiResumeSuggestion,
} from "@resumebuilder/shared";
import { fetchProfile, saveProfile, importProfile, fetchResumeHealthAi } from "../api/profileApi.js";
import { useAiMode } from "../shell/AiModeContext.js";
import ContactForm from "../components/ContactForm.js";
import SummaryForm from "../components/SummaryForm.js";
import WorkExperienceForm from "../components/WorkExperienceForm.js";
import ProjectsForm from "../components/ProjectsForm.js";
import VolunteerWorkForm from "../components/VolunteerWorkForm.js";
import SkillsForm from "../components/SkillsForm.js";
import EducationForm from "../components/EducationForm.js";
import CertificationsForm from "../components/CertificationsForm.js";
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
  { id: "resume-health", label: "Resume Health", icon: "❤️", group: "Insights" },
  { id: "skill-validation", label: "Skill Validation", icon: "✅", group: "Insights" },
  { id: "import", label: "Import from Resume", icon: "⬆️", group: "Insights" },
  { id: "contact-info", label: "Contact Info", icon: "👤", group: "Profile" },
  { id: "summary", label: "Summary", icon: "📝", group: "Profile" },
  { id: "work-experience", label: "Work Experience", icon: "💼", group: "Profile" },
  { id: "projects", label: "Projects", icon: "🛠️", group: "Profile" },
  { id: "volunteer-work", label: "Volunteer Work", icon: "🤝", group: "Profile" },
  { id: "skills", label: "Skills", icon: "✨", group: "Profile" },
  { id: "education", label: "Education", icon: "🎓", group: "Profile" },
  { id: "certifications", label: "Certifications", icon: "🏅", group: "Profile" },
] as const;

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const [importMethod, setImportMethod] = useState<"llm" | "deterministic" | null>(null);
  const [aiHealthStatus, setAiHealthStatus] = useState<AiHealthStatus>("idle");
  const [aiHealthSuggestions, setAiHealthSuggestions] = useState<AiResumeSuggestion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enabled: aiModeEnabled } = useAiMode();

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
      setProfile({ ...profile, ...draft });
      setImportMethod(method);
      setImportStatus("imported");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import resume.");
      setImportStatus("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleGetAiFeedback() {
    setAiHealthStatus("loading");
    try {
      const { suggestions } = await fetchResumeHealthAi();
      setAiHealthSuggestions(suggestions);
      setAiHealthStatus("loaded");
    } catch {
      setAiHealthStatus("error");
    }
  }

  const sidebarNode = useMemo(
    () => (
      <>
        {["Insights", "Profile"].map((group) => (
          <div key={group}>
            <div className="section-nav-label-group">{group}</div>
            <SectionNav items={SECTION_ITEMS.filter((i) => i.group === group)} />
          </div>
        ))}
      </>
    ),
    []
  );
  useSetSidebar(sidebarNode);

  const topBarExtraNode = useMemo(
    () => (
      <>
        <span className="status">
          {status === "saved" && "Saved"}
          {status === "error" && "Something went wrong"}
        </span>
        <button className="primary" onClick={handleSave} disabled={status === "saving" || !profile}>
          {status === "saving" ? "Saving…" : "Save"}
        </button>
      </>
    ),
    [status, profile, handleSave]
  );
  useSetTopBarExtra(topBarExtraNode);

  if (status === "loading") return <div className="app">Loading profile…</div>;
  if (!profile) return <div className="app">Failed to load profile.</div>;

  const scan = scanResume(profile);
  const skillValidation = validateSkills(profile);

  return (
    <div className="app">
      <h1 className="page-title">Master Profile</h1>
      <EditorToolbar />

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
            — review and correct the fields below before saving.
          </p>
        )}
        {importStatus === "error" && <p className="status">{importError}</p>}
      </section>

      <section className="form-section" id="resume-health">
        <h2>Resume Health</h2>
        <p className="status">Rule-based checks, recomputed live as you edit — no AI involved.</p>
        <div className="score-card-top">
          <ScoreGauge score={scan.score} />
          <div className="scan-summary">
            <p>
              {scan.suggestions.length === 0
                ? "No suggestions — this profile looks solid."
                : `${scan.suggestions.length} suggestion${scan.suggestions.length === 1 ? "" : "s"} to strengthen this resume.`}
            </p>
          </div>
        </div>
        {scan.suggestions.length > 0 && (
          <ul className="suggestion-list">
            {scan.suggestions.map((s) => (
              <li key={s.id} className="suggestion">
                <span className={`suggestion-severity-dot suggestion-severity-dot-${s.severity}`} aria-hidden="true" />
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
            onClick={handleGetAiFeedback}
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
              Qualitative writing feedback from an AI model — informational only, it never affects the score above.
            </p>
            {aiHealthSuggestions.length === 0 ? (
              <p className="status">No additional feedback — this profile reads well.</p>
            ) : (
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
            )}
          </div>
        )}
      </section>

      <section className="form-section" id="skill-validation">
        <h2>Skill Validation</h2>
        <p className="status">
          Cross-references your listed skills against the rest of your resume — keyword presence only, not a
          judgment of proficiency.
        </p>
        {skillValidation.findings.length === 0 ? (
          <p className="status">No findings.</p>
        ) : (
          <ul className="suggestion-list">
            {skillValidation.findings.map((f) => (
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

      <div id="contact-info">
        <ContactForm contact={profile.contact} onChange={(contact) => setProfile({ ...profile, contact })} />
      </div>
      <div id="summary">
        <SummaryForm summary={profile.summary} onChange={(summary) => setProfile({ ...profile, summary })} />
      </div>
      <div id="work-experience">
        <WorkExperienceForm
          entries={profile.workExperience}
          onChange={(workExperience) => setProfile({ ...profile, workExperience })}
        />
      </div>
      <div id="projects">
        <ProjectsForm entries={profile.projects} onChange={(projects) => setProfile({ ...profile, projects })} />
      </div>
      <div id="volunteer-work">
        <VolunteerWorkForm
          entries={profile.volunteerWork}
          onChange={(volunteerWork) => setProfile({ ...profile, volunteerWork })}
        />
      </div>
      <div id="skills">
        <SkillsForm skills={profile.skills} onChange={(skills) => setProfile({ ...profile, skills })} />
      </div>
      <div id="education">
        <EducationForm
          entries={profile.education}
          onChange={(education) => setProfile({ ...profile, education })}
        />
      </div>
      <div id="certifications">
        <CertificationsForm
          entries={profile.certifications}
          onChange={(certifications) => setProfile({ ...profile, certifications })}
        />
      </div>
    </div>
  );
}
