import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
} from "docx";
import { parseRichText, type TailoredResume, type TailoredWorkExperience, type TailoredProject } from "@resumebuilder/shared";

const PAGE_WIDTH_TWIPS = 12240 - 2 * 1440; // Letter width minus 1" margins each side

function dateRange(startDate?: string, endDate?: string): string | null {
  if (!startDate && !endDate) return null;
  return `${startDate ?? ""} – ${endDate || "Present"}`;
}

function nameParagraph(name: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: name || "Your Name", bold: true, size: 32 })],
  });
}

function contactLineParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 18, color: "444444" })],
  });
}

function sectionTitleParagraph(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 2 } },
    children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22 })],
  });
}

function entryHeaderParagraph(title: string, dates: string | null): Paragraph {
  const children = [new TextRun({ text: title, bold: true, size: 19 })];
  if (dates) {
    children.push(
      new TextRun({ text: `\t${dates}`, italics: true, size: 19 })
    );
  }
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH_TWIPS }],
    spacing: { after: 20 },
    children,
  });
}

function subLineParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text, italics: true, size: 18 })],
  });
}

/** Turns marked-up text (the same subset RichTextField/parseRichText produce) into DOCX TextRuns, so bold/italic/underline survive export instead of silently flattening to plain text. */
function richTextRuns(text: string, size: number): TextRun[] {
  return parseRichText(text).map(
    (seg) =>
      new TextRun({
        text: seg.text,
        size,
        bold: seg.bold,
        italics: seg.italic,
        underline: seg.underline ? {} : undefined,
      })
  );
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 20 },
    children: richTextRuns(text, 18),
  });
}

function summaryParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: richTextRuns(text, 18),
  });
}

function workExperienceParagraphs(entry: TailoredWorkExperience): Paragraph[] {
  return [
    entryHeaderParagraph(`${entry.title}, ${entry.company}`, dateRange(entry.startDate, entry.endDate)),
    ...entry.bullets.map(bulletParagraph),
  ];
}

function projectParagraphs(project: TailoredProject): Paragraph[] {
  const paragraphs = [entryHeaderParagraph(project.name, dateRange(project.startDate, project.endDate))];
  if (project.techStack.length > 0) paragraphs.push(subLineParagraph(project.techStack.join(", ")));
  paragraphs.push(...project.bullets.map(bulletParagraph));
  return paragraphs;
}

export async function buildResumeDocx(resume: TailoredResume): Promise<Buffer> {
  const { contact, summary, skills, workExperience, projects, education, certifications } = resume;
  const contactLine = [contact.email, contact.phone, contact.location].filter(Boolean).join(" | ");
  const linksLine = contact.links
    .map((l) => l.label)
    .filter(Boolean)
    .join(" | ");

  const children: Paragraph[] = [nameParagraph(contact.name)];
  if (contactLine) children.push(contactLineParagraph(contactLine));
  if (linksLine) children.push(contactLineParagraph(linksLine));

  if (summary.trim()) {
    children.push(sectionTitleParagraph("Summary"));
    children.push(summaryParagraph(summary));
  }

  if (skills.length > 0) {
    children.push(sectionTitleParagraph("Skills"));
    children.push(new Paragraph({ children: [new TextRun({ text: skills.map((s) => s.name).join(", "), size: 18 })] }));
  }

  if (workExperience.length > 0) {
    children.push(sectionTitleParagraph("Experience"));
    for (const entry of workExperience) children.push(...workExperienceParagraphs(entry));
  }

  if (projects.length > 0) {
    children.push(sectionTitleParagraph("Projects"));
    for (const project of projects) children.push(...projectParagraphs(project));
  }

  if (education.length > 0) {
    children.push(sectionTitleParagraph("Education"));
    for (const edu of education) {
      const title = `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}, ${edu.school}`;
      children.push(entryHeaderParagraph(title, dateRange(edu.startDate, edu.endDate)));
    }
  }

  if (certifications.length > 0) {
    children.push(sectionTitleParagraph("Certifications"));
    for (const cert of certifications) {
      const text = `${cert.name} — ${cert.issuer}${cert.date ? `, ${cert.date}` : ""}`;
      children.push(bulletParagraph(text));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
