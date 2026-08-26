import type { CoverLetterContent } from "@resumebuilder/shared";
import "./coverLetterDoc.css";

interface Props {
  letter: CoverLetterContent;
}

function today(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function CoverLetterDoc({ letter }: Props) {
  const { contact, companyName, hiringManagerName, openingParagraph, bodyParagraph, closingParagraph } = letter;
  const contactLine = [contact.email, contact.phone, contact.location].filter(Boolean).join(" | ");
  const greeting = hiringManagerName ? `Dear ${hiringManagerName},` : "Dear Hiring Manager,";

  return (
    <div className="coverletter-doc">
      <header className="coverletter-header">
        <div className="coverletter-name">{contact.name || "Your Name"}</div>
        {contactLine && <div className="coverletter-contact-line">{contactLine}</div>}
      </header>

      <div className="coverletter-date">{today()}</div>

      {(hiringManagerName || companyName) && (
        <div className="coverletter-recipient">
          {hiringManagerName && <div>{hiringManagerName}</div>}
          {companyName && <div>{companyName}</div>}
        </div>
      )}

      <div className="coverletter-greeting">{greeting}</div>

      <p className="coverletter-paragraph">{openingParagraph}</p>
      <p className="coverletter-paragraph">{bodyParagraph}</p>
      <p className="coverletter-paragraph">{closingParagraph}</p>

      <div className="coverletter-signoff">
        <div>Sincerely,</div>
        <div>{contact.name || "Your Name"}</div>
      </div>
    </div>
  );
}
