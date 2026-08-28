import puppeteer from "puppeteer";
import type { ResumeTemplateId } from "@resumebuilder/shared";

/** Master Profile download (untailored, whatever template is currently selected) -- see exportProfilePdf. */
export async function renderProfileToPdf(templateId: ResumeTemplateId): Promise<Buffer> {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const printUrl = `${frontendUrl}/print/profile?template=${encodeURIComponent(templateId)}`;

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle0" });
    await page.waitForSelector(".resume-print-root");
    const pdfUint8Array = await page.pdf({ format: "Letter", printBackground: true });
    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}

export async function renderResumeVersionToPdf(resumeVersionId: string): Promise<Buffer> {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const printUrl = `${frontendUrl}/print/${resumeVersionId}`;

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle0" });
    // Every resume template's root element carries this marker class
    // regardless of its own template-specific class, so PDF export doesn't
    // need to know which template was chosen.
    await page.waitForSelector(".resume-print-root");
    const pdfUint8Array = await page.pdf({ format: "Letter", printBackground: true });
    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}

export async function renderCoverLetterToPdf(
  resumeVersionId: string,
  options: { companyName?: string; hiringManagerName?: string; ai?: boolean } = {}
): Promise<Buffer> {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const params = new URLSearchParams();
  if (options.companyName) params.set("companyName", options.companyName);
  if (options.hiringManagerName) params.set("hiringManagerName", options.hiringManagerName);
  if (options.ai) params.set("ai", "true");
  const query = params.toString();
  const printUrl = `${frontendUrl}/print/cover-letter/${resumeVersionId}${query ? `?${query}` : ""}`;

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle0" });
    await page.waitForSelector(".coverletter-doc");
    const pdfUint8Array = await page.pdf({ format: "Letter", printBackground: true });
    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}
