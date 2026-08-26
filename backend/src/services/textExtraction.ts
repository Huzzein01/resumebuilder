import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function extractTextFromFile(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const lowerName = filename.toLowerCase();

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (mimeType === DOCX_MIME || lowerName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type — please upload a .pdf or .docx file.");
}
