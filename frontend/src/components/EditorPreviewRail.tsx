import { useEffect, useState } from "react";
import { resolveEffectiveTheme, setThemePreference, type ThemePreference } from "../theme.js";

interface EditorPreviewRailProps {
  onFullscreen: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Vertical icon strip beside the preview column, matching Main.pdf's
 * reference rail -- scoped to the icons that map to a real, already-built
 * or genuinely addable capability (fullscreen preview, dark/light theme,
 * collapse). The reference also shows color-swatch dots, a font ("Aa")
 * picker, and a stats icon; those would need new theming/typography
 * features this app doesn't have (per-template accent colors, font
 * switching), so they're left out rather than added as decoration with no
 * function behind them.
 */
export default function EditorPreviewRail({ onFullscreen, collapsed, onToggleCollapse }: EditorPreviewRailProps) {
  const [theme, setTheme] = useState<ThemePreference>(() => resolveEffectiveTheme());

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(resolveEffectiveTheme());
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  function toggleTheme() {
    const next: ThemePreference = theme === "dark" ? "light" : "dark";
    setThemePreference(next);
    setTheme(next);
  }

  return (
    <div className="editor-preview-rail">
      <button type="button" className="editor-rail-btn" onClick={onFullscreen} aria-label="Open fullscreen preview" title="Fullscreen preview">
        ⛶
      </button>
      <button
        type="button"
        className="editor-rail-btn"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
      <button
        type="button"
        className="editor-rail-btn"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Show preview panel" : "Hide preview panel"}
        title={collapsed ? "Show preview" : "Hide preview"}
      >
        {collapsed ? "▶" : "◀"}
      </button>
    </div>
  );
}
