import type { TailoredResume } from "@resumebuilder/shared";
import RichText from "../components/RichText.js";
import "./singleColumnResume.css";

interface Props {
  resume: TailoredResume;
}

function dateRange(startDate?: string, endDate?: string): string | null {
  if (!startDate && !endDate) return null;
  return `${startDate ?? ""} – ${endDate || "Present"}`;
}

export default function SingleColumnResume({ resume }: Props) {
  const { contact, summary, skills, workExperience, projects, education, certifications } = resume;
  const contactLine = [contact.email, contact.phone, contact.location].filter(Boolean).join(" | ");
  const linksLine = contact.links.map((l) => l.label).filter(Boolean).join(" | ");

  return (
    <div className="resume-doc">
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
    </div>
  );
}
