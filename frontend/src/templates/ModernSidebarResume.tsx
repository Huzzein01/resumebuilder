import type { TailoredResume, SimpleEntry } from "@resumebuilder/shared";
import RichText from "../components/RichText.js";
import "./modernSidebarResume.css";

interface Props {
  resume: TailoredResume;
}

function dateRange(startDate?: string, endDate?: string): string | null {
  if (!startDate && !endDate) return null;
  return `${startDate ?? ""} – ${endDate || "Present"}`;
}

const SIMPLE_ENTRY_SECTIONS: { key: keyof TailoredResume; title: string }[] = [
  { key: "researchExperience", title: "Research Experience" },
  { key: "leadership", title: "Leadership" },
  { key: "extraCurricular", title: "Extra Curricular Activities" },
  { key: "associations", title: "Associations" },
  { key: "awardsAndHonors", title: "Awards & Honors" },
  { key: "conferencesPresentations", title: "Conferences/Presentations" },
  { key: "courses", title: "Courses" },
  { key: "patents", title: "Patents" },
];

export default function ModernSidebarResume({ resume }: Props) {
  const { contact, summary, skills, workExperience, projects, education, certifications } = resume;

  return (
    <div className="ms-resume-doc resume-print-root">
      <aside className="ms-sidebar">
        <div className="ms-name">{contact.name || "Your Name"}</div>
        <div className="ms-sidebar-section">
          <div className="ms-sidebar-title">Contact</div>
          {contact.email && <div className="ms-sidebar-line">{contact.email}</div>}
          {contact.phone && <div className="ms-sidebar-line">{contact.phone}</div>}
          {contact.location && <div className="ms-sidebar-line">{contact.location}</div>}
          {contact.links.map((l, i) => (
            <div className="ms-sidebar-line" key={i}>
              {l.label}
            </div>
          ))}
        </div>

        {skills.length > 0 && (
          <div className="ms-sidebar-section">
            <div className="ms-sidebar-title">Skills</div>
            <div className="ms-skill-tags">
              {skills.map((s) => (
                <span className="ms-skill-tag" key={s.id}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div className="ms-sidebar-section">
            <div className="ms-sidebar-title">Education</div>
            {education.map((edu) => (
              <div className="ms-sidebar-entry" key={edu.id}>
                <div className="ms-sidebar-entry-title">
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                </div>
                <div className="ms-sidebar-line">{edu.school}</div>
                <div className="ms-sidebar-line">{dateRange(edu.startDate, edu.endDate)}</div>
              </div>
            ))}
          </div>
        )}

        {certifications.length > 0 && (
          <div className="ms-sidebar-section">
            <div className="ms-sidebar-title">Certifications</div>
            {certifications.map((cert) => (
              <div className="ms-sidebar-line" key={cert.id}>
                {cert.name} — {cert.issuer}
              </div>
            ))}
          </div>
        )}

        {resume.languages.length > 0 && (
          <div className="ms-sidebar-section">
            <div className="ms-sidebar-title">Languages</div>
            <div className="ms-sidebar-line">{resume.languages.join(", ")}</div>
          </div>
        )}

        {resume.hobbiesAndInterests.length > 0 && (
          <div className="ms-sidebar-section">
            <div className="ms-sidebar-title">Hobbies & Interests</div>
            <div className="ms-sidebar-line">{resume.hobbiesAndInterests.join(", ")}</div>
          </div>
        )}

        {resume.testScores.length > 0 && (
          <div className="ms-sidebar-section">
            <div className="ms-sidebar-title">Test Scores</div>
            {resume.testScores.map((score) => (
              <div className="ms-sidebar-line" key={score.id}>
                {score.name}: {score.score}
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="ms-main">
        {summary.trim() && (
          <section className="ms-section">
            <div className="ms-section-title">Summary</div>
            <p className="ms-summary">
              <RichText text={summary} />
            </p>
          </section>
        )}

        {workExperience.length > 0 && (
          <section className="ms-section">
            <div className="ms-section-title">Experience</div>
            {workExperience.map((entry) => (
              <div className="ms-entry" key={entry.id}>
                <div className="ms-entry-header">
                  <span className="ms-entry-title">
                    {entry.title} <span className="ms-entry-company">· {entry.company}</span>
                  </span>
                  <span className="ms-entry-dates">{dateRange(entry.startDate, entry.endDate)}</span>
                </div>
                {entry.bullets.length > 0 && (
                  <ul className="ms-bullet-list">
                    {entry.bullets.map((text, i) => (
                      <li className="ms-bullet" key={i}>
                        <RichText text={text} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {projects.length > 0 && (
          <section className="ms-section">
            <div className="ms-section-title">Projects</div>
            {projects.map((project) => (
              <div className="ms-entry" key={project.id}>
                <div className="ms-entry-header">
                  <span className="ms-entry-title">{project.name}</span>
                  <span className="ms-entry-dates">{dateRange(project.startDate, project.endDate)}</span>
                </div>
                {project.techStack.length > 0 && (
                  <div className="ms-tech-stack">{project.techStack.join(", ")}</div>
                )}
                {project.bullets.length > 0 && (
                  <ul className="ms-bullet-list">
                    {project.bullets.map((text, i) => (
                      <li className="ms-bullet" key={i}>
                        <RichText text={text} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {resume.volunteerWork.length > 0 && (
          <section className="ms-section">
            <div className="ms-section-title">Volunteer Work</div>
            {resume.volunteerWork.map((entry) => (
              <div className="ms-entry" key={entry.id}>
                <div className="ms-entry-header">
                  <span className="ms-entry-title">
                    {entry.role} <span className="ms-entry-company">· {entry.organization}</span>
                  </span>
                  <span className="ms-entry-dates">{dateRange(entry.startDate, entry.endDate)}</span>
                </div>
                {entry.bullets.length > 0 && (
                  <ul className="ms-bullet-list">
                    {entry.bullets.map((b) => (
                      <li className="ms-bullet" key={b.id}>
                        <RichText text={b.text} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {SIMPLE_ENTRY_SECTIONS.map(({ key, title }) => {
          const entries = resume[key] as SimpleEntry[];
          if (entries.length === 0) return null;
          return (
            <section className="ms-section" key={key}>
              <div className="ms-section-title">{title}</div>
              {entries.map((entry) => (
                <div className="ms-entry" key={entry.id}>
                  <div className="ms-entry-header">
                    <span className="ms-entry-title">
                      {entry.title}
                      {entry.subtitle && <span className="ms-entry-company"> · {entry.subtitle}</span>}
                    </span>
                    <span className="ms-entry-dates">{dateRange(entry.startDate, entry.endDate)}</span>
                  </div>
                  {entry.bullets.length > 0 && (
                    <ul className="ms-bullet-list">
                      {entry.bullets.map((b) => (
                        <li className="ms-bullet" key={b.id}>
                          <RichText text={b.text} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          );
        })}

        {resume.publications.length > 0 && (
          <section className="ms-section">
            <div className="ms-section-title">Publications</div>
            <ol className="ms-numbered-list">
              {resume.publications.map((item) => (
                <li key={item.id}>
                  <RichText text={item.text} />
                </li>
              ))}
            </ol>
          </section>
        )}

        {resume.publicationsAbstract.length > 0 && (
          <section className="ms-section">
            <div className="ms-section-title">Publications Abstract</div>
            <ol className="ms-numbered-list">
              {resume.publicationsAbstract.map((item) => (
                <li key={item.id}>
                  <RichText text={item.text} />
                </li>
              ))}
            </ol>
          </section>
        )}

        {resume.references.length > 0 && (
          <section className="ms-section">
            <div className="ms-section-title">References</div>
            <ul className="ms-bullet-list">
              {resume.references.map((ref) => (
                <li className="ms-bullet" key={ref.id}>
                  {ref.name}
                  {ref.relationship ? ` — ${ref.relationship}` : ""}
                  {[ref.email, ref.phone].filter(Boolean).length > 0
                    ? ` (${[ref.email, ref.phone].filter(Boolean).join(" | ")})`
                    : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
