import type { Request, Response } from "express";
import { extractTextFromFile } from "../services/textExtraction.js";
import { parseResumeText } from "../services/resumeParser.js";

export async function importProfile(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded — attach a .pdf or .docx resume as 'resume'." });
    return;
  }

  try {
    const rawText = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);
    const draft = parseResumeText(rawText);
    res.json(draft);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse the uploaded file.";
    res.status(400).json({ error: message });
  }
}
