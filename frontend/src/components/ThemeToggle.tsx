import { useEffect, useState } from "react";
import { resolveEffectiveTheme, setThemePreference, type ThemePreference } from "../theme.js";

/**
 * Global light/dark switch -- lives on the Settings page (not the editor's
 * preview rail, which was removed) since it's an app-wide preference, not
 * scoped to any one page. Same pill-switch visual as AiModeToggle, reusing
 * its CSS classes with Light/Dark labels instead of Manual/AI.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(() => resolveEffectiveTheme());

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(resolveEffectiveTheme());
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next: ThemePreference = theme === "dark" ? "light" : "dark";
    setThemePreference(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      className={`ai-mode-toggle${theme === "dark" ? " on" : ""}`}
      role="switch"
      aria-checked={theme === "dark"}
      onClick={toggle}
      title={theme === "dark" ? "Dark theme is on" : "Light theme is on"}
    >
      <span className="ai-mode-toggle-label ai-mode-toggle-label-off">Light</span>
      <span className="ai-mode-toggle-track" aria-hidden="true">
        <span className="ai-mode-toggle-thumb" />
      </span>
      <span className="ai-mode-toggle-label ai-mode-toggle-label-on">Dark</span>
    </button>
  );
}
