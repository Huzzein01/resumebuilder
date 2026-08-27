import type { Request, Response } from "express";
import type { ProfileImportResult } from "@resumebuilder/shared";
import { extractTextFromFile } from "../services/textExtraction.js";
import { parseResumeText } from "../services/resumeParser.js";
import { importProfileWithLlm } from "../services/llm/resumeImporter.js";
import { isAiModeRequested } from "../middleware/aiMode.js";

export async function importProfile(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded — attach a .pdf or .docx resume as 'resume'." });
    return;
  }

  let rawText: string;
  try {
    rawText = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse the uploaded file.";
    res.status(400).json({ error: message });
    return;
  }

  // The LLM path is only attempted when the user has explicitly switched
  // the app into AI mode -- Manual mode must never make an LLM call, even if
  // a provider key happens to be configured server-side. Within AI mode,
  // extraction is still strictly best-effort: any failure (every provider
  // down, a response that fails schema validation) falls back to the
  // deterministic parser rather than ever surfacing a broken import. The
  // response always says which path actually produced it so the UI can
  // label AI-produced results distinctly instead of presenting the two
  // identically -- including telling the user when AI mode was on but
  // still fell back, which "method: llm vs deterministic" already conveys.
  if (isAiModeRequested(req)) {
    try {
      const { draft, providerName } = await importProfileWithLlm(rawText);
      const result: ProfileImportResult = { draft, method: "llm", provider: providerName };
      res.json(result);
      return;
    } catch (err) {
      console.error("LLM resume import failed, falling back to deterministic parser:", err);
    }
  }

  const draft = parseResumeText(rawText);
  const result: ProfileImportResult = { draft, method: "deterministic" };
  res.json(result);
}
