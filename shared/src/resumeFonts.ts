/**
 * Curated, resume-appropriate font choices for the editor toolbar's font
 * picker -- every entry is a real cross-platform web-safe stack (so it
 * renders identically in the editor, the live preview, and PDF export via
 * Puppeteer, all Chromium) rather than a single font name that might be
 * missing on a given machine. Deliberately excludes novelty/handwriting
 * faces (Comic Sans, Impact, ...) -- this is a professional-document tool.
 */
export interface ResumeFontOption {
  /** Stored on Profile.fontFamily and used directly as a CSS font-family value. */
  value: string;
  /** Shown in the toolbar's font dropdown. */
  label: string;
}

export const RESUME_FONT_FAMILIES: ResumeFontOption[] = [
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia" },
  { value: "Garamond, Georgia, serif", label: "Garamond" },
  { value: "Cambria, Georgia, serif", label: "Cambria" },
  { value: "'Palatino Linotype', Palatino, serif", label: "Palatino" },
  { value: "'Book Antiqua', Palatino, serif", label: "Book Antiqua" },
  { value: "Calibri, Candara, sans-serif", label: "Calibri" },
  { value: "Candara, Calibri, sans-serif", label: "Candara" },
  { value: "'Segoe UI', Calibri, sans-serif", label: "Segoe UI" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "Tahoma, Verdana, sans-serif", label: "Tahoma" },
  { value: "'Trebuchet MS', Verdana, sans-serif", label: "Trebuchet MS" },
  { value: "'Century Gothic', 'Segoe UI', sans-serif", label: "Century Gothic" },
  { value: "'Franklin Gothic Medium', Arial, sans-serif", label: "Franklin Gothic" },
  { value: "'Lucida Sans', 'Lucida Sans Unicode', sans-serif", label: "Lucida Sans" },
  { value: "'Courier New', Courier, monospace", label: "Courier New" },
  { value: "Consolas, 'Courier New', monospace", label: "Consolas" },
];

/** Matches the templates' un-overridden default (.resume-doc/.ms-resume-doc's base font-size, 12pt == the browser default 16px root that every template's rem-sized text used to be calculated against before font-size became a per-document, em-based override). */
export const DEFAULT_RESUME_FONT_SIZE = 12;

/** Point sizes offered in the toolbar's font-size picker -- the range most resumes actually use (9-9.5pt for dense one-pagers, up to 14pt for headers-as-body-text). */
export const RESUME_FONT_SIZES = [9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 14];
