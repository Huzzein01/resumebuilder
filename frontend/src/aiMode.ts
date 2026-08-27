// Plain (non-React) module so both the AiModeContext (for reactive UI) and
// the api/ layer (plain functions, no hooks available) can read/write the
// same source of truth without duplicating the storage key or the fallback
// behavior when localStorage is unavailable.

const STORAGE_KEY = "resumebuilder.aiMode";

/**
 * Defaults to false (manual/deterministic) -- the app must work fully with
 * this off, and requiring an explicit opt-in into AI mode is the safer
 * default for a first run or a browser with storage disabled/cleared.
 */
export function getAiModeEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAiModeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    /* best-effort persistence only -- the in-memory React state still works for this session */
  }
}

/** Header sent on every backend request that has an AI-augmented path, so the server gates on the user's actual choice rather than only on whether a provider key happens to be configured. */
export function aiModeHeader(): Record<string, string> {
  return { "X-AI-Mode": getAiModeEnabled() ? "true" : "false" };
}
