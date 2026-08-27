export interface RichTextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u"]);

function isBold(tag: string): boolean {
  return tag === "b" || tag === "strong";
}
function isItalic(tag: string): boolean {
  return tag === "i" || tag === "em";
}
function isUnderline(tag: string): boolean {
  return tag === "u";
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Parses a constrained HTML subset (only <b>/<strong>, <i>/<em>, <u>, possibly
 * nested) into flat text segments with cumulative formatting flags. This is
 * the one place formatting is interpreted -- both the React resume/cover-letter
 * templates and the DOCX exporter build on it, so the two can't drift out of
 * sync the way they would if each parsed rich text independently.
 *
 * Deliberately not a general HTML parser: anything outside the allowed tag
 * set is treated as plain text (its angle brackets pass through literally),
 * which keeps this safe to run on arbitrary saved data without an XSS surface.
 */
export function parseRichText(input: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  const stack: string[] = [];
  let buffer = "";

  function flush() {
    if (buffer.length === 0) return;
    segments.push({
      text: decodeEntities(buffer),
      bold: stack.some(isBold) || undefined,
      italic: stack.some(isItalic) || undefined,
      underline: stack.some(isUnderline) || undefined,
    });
    buffer = "";
  }

  const tagPattern = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(input)) !== null) {
    buffer += input.slice(lastIndex, match.index);
    lastIndex = tagPattern.lastIndex;

    const raw = match[0];
    const tag = match[1].toLowerCase();
    const isClosing = raw.startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) {
      // Unknown tag: drop the tag itself but keep its inner text content (standard
      // sanitizer behavior) -- flush first so it doesn't merge into an adjacent
      // formatted segment.
      flush();
      continue;
    }

    if (isClosing) {
      flush();
      const idx = stack.lastIndexOf(tag);
      if (idx !== -1) stack.splice(idx, 1);
    } else {
      flush();
      stack.push(tag);
    }
  }

  buffer += input.slice(lastIndex);
  flush();

  return segments;
}

/**
 * Re-serializes constrained HTML down to just the allowed tags, dropping
 * everything else (attributes, other elements, scripts). Used before persisting
 * anything a contentEditable surface produced.
 */
export function sanitizeRichText(input: string): string {
  return parseRichText(input)
    .map((seg) => {
      let text = seg.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (seg.bold) text = `<b>${text}</b>`;
      if (seg.italic) text = `<i>${text}</i>`;
      if (seg.underline) text = `<u>${text}</u>`;
      return text;
    })
    .join("");
}

/** Strips all formatting, returning plain text -- used anywhere formatting doesn't apply (e.g. keyword scoring already works fine on marked-up text since tag boundaries are non-word characters, but a plain-text view is sometimes clearer). */
export function stripRichText(input: string): string {
  return parseRichText(input)
    .map((seg) => seg.text)
    .join("");
}
