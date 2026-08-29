import type { ComponentType, ReactNode } from "react";
import type { TailoredResume, SimpleEntry } from "@resumebuilder/shared";
import { resolveSectionOrder, type ResumeSectionId } from "@resumebuilder/shared";
import RichText from "../components/RichText.js";
import "./singleColumnResume.css";

interface Props {
  resume: TailoredResume;
}

function dateRange(startDate?: string, endDate?: string): string | null {
  if (!startDate && !endDate) return null;
  return `${startDate ?? ""} – ${endDate || "Present"}`;
}

const SIMPLE_ENTRY_SECTIONS: { id: ResumeSectionId; key: keyof TailoredResume; title: string }[] = [
  { id: "research-experience", key: "researchExperience", title: "Research Experience" },
  { id: "leadership", key: "leadership", title: "Leadership" },
  { id: "extra-curricular", key: "extraCurricular", title: "Extra Curricular Activities" },
  { id: "associations", key: "associations", title: "Associations" },
  { id: "awards-honors", key: "awardsAndHonors", title: "Awards & Honors" },
  { id: "conferences-presentations", key: "conferencesPresentations", title: "Conferences/Presentations" },
  { id: "courses", key: "courses", title: "Courses" },
  { id: "patents", key: "patents", title: "Patents" },
];

/**
 * All single-column ATS-safe templates (Classic, Minimal, Modern Serif,
 * Bold Header, Compact, Executive, Technical) share this exact structure --
 * one text column, no tables/columns/graphics an ATS parser could choke on
 * -- and differ only in typography/spacing/color, driven entirely by CSS
 * keyed on the `data-variant` attribute (see singleColumnResume.css). This
 * factory exists so each variant is a real, independently-selectable
 * template without duplicating this ~230-line render function eight times.
 *
 * Sections render in resume.sectionOrder (drag-reordered in the editor
 * sidebar; see resumeSectionOrder.ts for the shared id list and fallback
 * behavior) via a lookup of id -> node built once per render, then mapped
 * over resolveSectionOrder() -- not a fixed JSX sequence like before, so
 * the actual document order can differ per profile. Contact Info is not
 * reorderable -- it's the header, always first.
 */
export function createAtsTemplate(variant: string): ComponentType<Props> {
  function AtsResumeTemplate({ resume }: Props) {
    const { contact, summary, skills, workExperience, projects, education, certifications } = resume;
    const contactLine = [contact.email, contact.phone, contact.location].filter(Boolean).join(" | ");
    const linksLine = contact.links.map((l) => l.label).filter(Boolean).join(" | ");

    const sections: Partial<Record<ResumeSectionId, ReactNode>> = {
      summary: summary.trim() && (
        <section className="resume-section">
          <div className="resume-section-title">Summary</div>
          <p className="resume-summary">
            <RichText text={summary} />
          </p>
        </section>
      ),

      skills: skills.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Skills</div>
          <div className="resume-skills-line">{skills.map((s) => s.name).join(", ")}</div>
        </section>
      ),

      "work-experience": workExperience.length > 0 && (
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
      ),

      projects: projects.length > 0 && (
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
      ),

      education: education.length > 0 && (
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
      ),

      certifications: certifications.length > 0 && (
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
      ),

      "volunteer-work": resume.volunteerWork.length > 0 && (
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
      ),

      publications: resume.publications.length > 0 && (
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
      ),

      "publications-abstract": resume.publicationsAbstract.length > 0 && (
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
      ),

      "test-scores": resume.testScores.length > 0 && (
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
      ),

      languages: resume.languages.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Languages</div>
          <div className="resume-skills-line">{resume.languages.join(", ")}</div>
        </section>
      ),

      "hobbies-interests": resume.hobbiesAndInterests.length > 0 && (
        <section className="resume-section">
          <div className="resume-section-title">Hobbies & Interests</div>
          <div className="resume-skills-line">{resume.hobbiesAndInterests.join(", ")}</div>
        </section>
      ),

      references: resume.references.length > 0 && (
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
      ),
    };

    for (const { id, key, title } of SIMPLE_ENTRY_SECTIONS) {
      const entries = resume[key] as SimpleEntry[];
      sections[id] = entries.length > 0 && (
        <section className="resume-section">
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
    }

    return (
      <div className="resume-doc resume-print-root" data-variant={variant}>
        <header className="resume-header">
          <div className="resume-name">{contact.name || "Your Name"}</div>
          {contactLine && <div className="resume-contact-line">{contactLine}</div>}
          {linksLine && <div className="resume-contact-line">{linksLine}</div>}
        </header>

        {resolveSectionOrder(resume.sectionOrder).map((id) => (
          <SectionSlot key={id}>{sections[id]}</SectionSlot>
        ))}
      </div>
    );
  }

  return AtsResumeTemplate;
}

/** Renders nothing for a falsy/empty section without a key-collision or fragment wrapper -- keeps the .map() above simple. */
function SectionSlot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
