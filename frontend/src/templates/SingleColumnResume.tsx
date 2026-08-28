import type { TailoredResume, SimpleEntry } from "@resumebuilder/shared";
import RichText from "../components/RichText.js";
import "./singleColumnResume.css";

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

export default function SingleColumnResume({ resume }: Props) {
  const { contact, summary, skills, workExperience, projects, education, certifications } = resume;
  const contactLine = [contact.email, contact.phone, contact.location].filter(Boolean).join(" | ");
  const linksLine = contact.links.map((l) => l.label).filter(Boolean).join(" | ");

  return (
    <div className="resume-doc resume-print-root">
      <header className="resume-header">
        <div className="resume-name">{contact.name || "Your Name"}</div>
        {contactLine && <div className="resume-contact-line">{contactLine}</div>}
        {linksLine && <div className="resume-contact-line">{linksLine}</div>}
      </header>

      {summary.trim() && (
        <section className="resume-section">
          <div className="resume-section-title">Summary</div>
          <p className="resume-summary">
            <RichText text={summary} />
          </p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Skills</div>
          <div className="resume-skills-line">{skills.map((s) => s.name).join(", ")}</div>
        </section>
      )}

      {workExperience.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Experience</div>
          {workExperience.map((entry) => (
            <div className="resume-entry" key={entry.id}>
              <div className="resume-entry-header">
                <span className="resume-entry-title">
                  {entry.title}, {entry.company}
                </span>
                <span className="resume-entry-dates">{dateRange(entry.startDate, entry.endDate)}</span>
              </div>
              {entry.bullets.length > 0 && (
                <ul className="resume-bullet-list">
                  {entry.bullets.map((text, i) => (
                    <li className="resume-bullet" key={i}>
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
        <section className="resume-section">
          <div className="resume-section-title">Projects</div>
          {projects.map((project) => (
            <div className="resume-entry" key={project.id}>
              <div className="resume-entry-header">
                <span className="resume-entry-title">{project.name}</span>
                <span className="resume-entry-dates">{dateRange(project.startDate, project.endDate)}</span>
              </div>
              {project.techStack.length > 0 && (
                <div className="resume-tech-stack">{project.techStack.join(", ")}</div>
              )}
              {project.bullets.length > 0 && (
                <ul className="resume-bullet-list">
                  {project.bullets.map((text, i) => (
                    <li className="resume-bullet" key={i}>
                      <RichText text={text} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Education</div>
          {education.map((edu) => (
            <div className="resume-entry" key={edu.id}>
              <div className="resume-entry-header">
                <span className="resume-entry-title">
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}, {edu.school}
                </span>
                <span className="resume-entry-dates">{dateRange(edu.startDate, edu.endDate)}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {certifications.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Certifications</div>
          <ul className="resume-bullet-list">
            {certifications.map((cert) => (
              <li className="resume-bullet" key={cert.id}>
                {cert.name} — {cert.issuer}
                {cert.date ? `, ${cert.date}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {resume.volunteerWork.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Volunteer Work</div>
          {resume.volunteerWork.map((entry) => (
            <div className="resume-entry" key={entry.id}>
              <div className="resume-entry-header">
                <span className="resume-entry-title">
                  {entry.role}, {entry.organization}
                </span>
                <span className="resume-entry-dates">{dateRange(entry.startDate, entry.endDate)}</span>
              </div>
              {entry.bullets.length > 0 && (
                <ul className="resume-bullet-list">
                  {entry.bullets.map((b) => (
                    <li className="resume-bullet" key={b.id}>
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
          <section className="resume-section" key={key}>
            <div className="resume-section-title">{title}</div>
            {entries.map((entry) => (
              <div className="resume-entry" key={entry.id}>
                <div className="resume-entry-header">
                  <span className="resume-entry-title">
                    {entry.title}
                    {entry.subtitle ? `, ${entry.subtitle}` : ""}
                  </span>
                  <span className="resume-entry-dates">{dateRange(entry.startDate, entry.endDate)}</span>
                </div>
                {entry.bullets.length > 0 && (
                  <ul className="resume-bullet-list">
                    {entry.bullets.map((b) => (
                      <li className="resume-bullet" key={b.id}>
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
        <section className="resume-section">
          <div className="resume-section-title">Publications</div>
          <ol className="resume-numbered-list">
            {resume.publications.map((item) => (
              <li key={item.id}>
                <RichText text={item.text} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {resume.publicationsAbstract.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Publications Abstract</div>
          <ol className="resume-numbered-list">
            {resume.publicationsAbstract.map((item) => (
              <li key={item.id}>
                <RichText text={item.text} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {resume.testScores.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Test Scores</div>
          <ul className="resume-bullet-list">
            {resume.testScores.map((score) => (
              <li className="resume-bullet" key={score.id}>
                {score.name}: {score.score}
                {score.date ? ` (${score.date})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {resume.languages.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Languages</div>
          <div className="resume-skills-line">{resume.languages.join(", ")}</div>
        </section>
      )}

      {resume.hobbiesAndInterests.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Hobbies & Interests</div>
          <div className="resume-skills-line">{resume.hobbiesAndInterests.join(", ")}</div>
        </section>
      )}

      {resume.references.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">References</div>
          <ul className="resume-bullet-list">
            {resume.references.map((ref) => (
              <li className="resume-bullet" key={ref.id}>
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
    </div>
  );
}
