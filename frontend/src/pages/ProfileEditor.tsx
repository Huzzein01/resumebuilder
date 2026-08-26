import { useEffect, useRef, useState } from "react";
import { scanResume, validateSkills, type Profile, type ScanTargetType } from "@resumebuilder/shared";
import { fetchProfile, saveProfile, importProfile } from "../api/profileApi.js";
import ContactForm from "../components/ContactForm.js";
import SummaryForm from "../components/SummaryForm.js";
import WorkExperienceForm from "../components/WorkExperienceForm.js";
import ProjectsForm from "../components/ProjectsForm.js";
import VolunteerWorkForm from "../components/VolunteerWorkForm.js";
import SkillsForm from "../components/SkillsForm.js";
import EducationForm from "../components/EducationForm.js";
import CertificationsForm from "../components/CertificationsForm.js";
import ScoreGauge from "../components/ScoreGauge.js";

type Status = "loading" | "ready" | "saving" | "saved" | "error";
type ImportStatus = "idle" | "importing" | "imported" | "error";

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

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile()
      .then((p) => {
        setProfile(p);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function handleSave() {
    if (!profile) return;
    setStatus("saving");
    try {
      const saved = await saveProfile(profile);
      setProfile(saved);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  async function handleImportFile(file: File) {
    if (!profile) return;
    setImportStatus("importing");
    setImportError(null);
    try {
      const draft = await importProfile(file);
      setProfile({ ...profile, ...draft });
      setImportStatus("imported");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import resume.");
      setImportStatus("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (status === "loading") return <div className="app">Loading profile…</div>;
  if (!profile) return <div className="app">Failed to load profile.</div>;

  const scan = scanResume(profile);
  const skillValidation = validateSkills(profile);

  return (
    <div className="app">
      <div className="toolbar">
        <h1>Master Profile</h1>
        <button className="primary" onClick={handleSave} disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        <span className="status">
          {status === "saved" && "Saved"}
          {status === "error" && "Something went wrong"}
        </span>
      </div>

      <section className="form-section">
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
          <p className="status">Parsed — review and correct the fields below before saving.</p>
        )}
        {importStatus === "error" && <p className="status">{importError}</p>}
      </section>

      <section className="form-section">
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
      </section>

      <section className="form-section">
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

      <ContactForm contact={profile.contact} onChange={(contact) => setProfile({ ...profile, contact })} />
      <SummaryForm summary={profile.summary} onChange={(summary) => setProfile({ ...profile, summary })} />
      <WorkExperienceForm
        entries={profile.workExperience}
        onChange={(workExperience) => setProfile({ ...profile, workExperience })}
      />
      <ProjectsForm
        entries={profile.projects}
        onChange={(projects) => setProfile({ ...profile, projects })}
      />
      <VolunteerWorkForm
        entries={profile.volunteerWork}
        onChange={(volunteerWork) => setProfile({ ...profile, volunteerWork })}
      />
      <SkillsForm skills={profile.skills} onChange={(skills) => setProfile({ ...profile, skills })} />
      <EducationForm
        entries={profile.education}
        onChange={(education) => setProfile({ ...profile, education })}
      />
      <CertificationsForm
        entries={profile.certifications}
        onChange={(certifications) => setProfile({ ...profile, certifications })}
      />
    </div>
  );
}
