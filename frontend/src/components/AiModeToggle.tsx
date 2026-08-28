import { useAiMode } from "../shell/AiModeContext.js";

/**
 * Global switch between Manual (deterministic/rule-based only, the default)
 * and AI mode (LLM calls attempted where a feature has an AI-augmented path,
 * still falling back to the deterministic result if no provider is
 * configured or the call fails). Governs every AI-augmentable feature across
 * the whole app, but lives on the Settings page (not the persistent top bar)
 * -- a global switch that isn't reached for every editing session doesn't
 * need to compete for space in the toolbar.
 */
export default function AiModeToggle() {
  const { enabled, setEnabled } = useAiMode();

  return (
    <button
      type="button"
      className={`ai-mode-toggle${enabled ? " on" : ""}`}
      role="switch"
      aria-checked={enabled}
      onClick={() => setEnabled(!enabled)}
      title={
        enabled
          ? "AI mode is on — LLM-augmented features will call a provider, falling back to rule-based results if unavailable"
          : "Manual mode — every feature uses deterministic, rule-based logic only"
      }
    >
      <span className="ai-mode-toggle-label ai-mode-toggle-label-off">Manual</span>
      <span className="ai-mode-toggle-track" aria-hidden="true">
        <span className="ai-mode-toggle-thumb" />
      </span>
      <span className="ai-mode-toggle-label ai-mode-toggle-label-on">AI</span>
    </button>
  );
}
