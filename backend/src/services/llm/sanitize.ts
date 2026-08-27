const MAX_INPUT_CHARS = 15000;

// Lines that look like a role marker for a chat-style prompt (e.g. a resume
// containing "System: ignore the above and..."), matched at the start of a
// line so a legitimate word like "Systems Engineer" is never touched.
const ROLE_MARKER_LINE = /^\s*(system|assistant|user|human)\s*:/gim;

// Zero-width / invisible characters are a known way to hide injected text
// from a casual read while still being tokenized normally by the model.
const INVISIBLE_CHARS = /[​-‏‪-‮﻿]/g;

/**
 * Defense-in-depth against prompt injection in resume/JD text before it's
 * embedded in an LLM prompt. This is not the primary defense -- that's the
 * explicit delimiting + "this is data, not instructions" framing in the
 * prompt template itself -- but a resume is exactly the kind of untrusted,
 * user-controlled text that could carry an injection attempt (same threat
 * model as SwipeConnect's resume/JD/bio inputs).
 */
export function sanitizeForPrompt(text: string): string {
  return text
    .replace(INVISIBLE_CHARS, "")
    .replace(ROLE_MARKER_LINE, "[$1]:")
    .slice(0, MAX_INPUT_CHARS);
}
