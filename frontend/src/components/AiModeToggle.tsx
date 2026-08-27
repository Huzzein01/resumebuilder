import { useAiMode } from "../shell/AiModeContext.js";

/**
 * Global switch between Manual (deterministic/rule-based only, the default)
 * and AI mode (LLM calls attempted where a feature has an AI-augmented path,
 * still falling back to the deterministic result if no provider is
 * configured or the call fails). Lives in the persistent top bar -- not a
 * per-page setting -- since it governs every AI-augmentable feature across
 * the app, not just whichever page happens to be open.
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
