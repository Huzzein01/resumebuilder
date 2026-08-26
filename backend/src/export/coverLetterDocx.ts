import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import type { CoverLetterContent } from "@resumebuilder/shared";

function today(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export async function buildCoverLetterDocx(letter: CoverLetterContent): Promise<Buffer> {
  const { contact, companyName, hiringManagerName, openingParagraph, bodyParagraph, closingParagraph } = letter;
  const contactLine = [contact.email, contact.phone, contact.location].filter(Boolean).join(" | ");

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: contact.name || "Your Name", bold: true, size: 28 })],
    }),
  ];

  if (contactLine) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: contactLine, size: 18, color: "444444" })],
      })
    );
  }

  children.push(new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: today(), size: 20 })] }));

  if (hiringManagerName || companyName) {
    const lines = [hiringManagerName, companyName].filter(Boolean) as string[];
    for (const line of lines) {
      children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: line, size: 20 })] }));
    }
    children.push(new Paragraph({ spacing: { after: 240 }, children: [] }));
  }

  const greeting = hiringManagerName ? `Dear ${hiringManagerName},` : "Dear Hiring Manager,";
  children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: greeting, size: 20 })] }));

  for (const paragraph of [openingParagraph, bodyParagraph, closingParagraph]) {
    children.push(
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: paragraph, size: 20 })] })
    );
  }

  children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Sincerely,", size: 20 })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: contact.name || "Your Name", size: 20 })] }));

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}
