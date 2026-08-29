// Plain (non-React) module, same pattern as aiMode.ts -- applied as early as
// possible in main.tsx (before React renders) to avoid a flash of the wrong
// theme, and reused by ThemeToggle for the explicit user override.
//
// index.css already has full light/dark token sets keyed off `prefers-
// color-scheme` (system default) and an explicit `[data-theme]` attribute
// on <html> (user override, wins either direction) -- this module is just
// the missing piece: reading/writing that attribute and persisting the
// user's choice.

const STORAGE_KEY = "resumebuilder.theme";

export type ThemePreference = "light" | "dark";

export function getStoredThemePreference(): ThemePreference | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

/** What's actually rendered right now -- the explicit override if one is stored, else the OS/browser preference. */
export function resolveEffectiveTheme(): ThemePreference {
  return getStoredThemePreference() ?? (systemPrefersDark() ? "dark" : "light");
}

export function applyTheme(pref: ThemePreference): void {
  document.documentElement.setAttribute("data-theme", pref);
}

/** Call once on app start, before the first paint, so the page renders in the right theme immediately. */
export function initTheme(): void {
  const stored = getStoredThemePreference();
  if (stored) applyTheme(stored);
  // No stored override: leave the attribute unset so the system-preference
  // CSS block (prefers-color-scheme) governs, exactly as it did before this
  // module existed.
}

export function setThemePreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* best-effort only -- the in-memory attribute change still works for this session */
  }
  applyTheme(pref);
}
