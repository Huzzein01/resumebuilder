import { useState } from "react";
import { RESUME_TEMPLATES, type ResumeTemplateId } from "@resumebuilder/shared";
import { useNav } from "../shell/NavContext.js";

interface EditorQuickActionsProps {
  templateId: ResumeTemplateId;
  onSelectTemplate: (id: ResumeTemplateId) => void;
  /** Live-swaps the preview to a hovered-but-not-yet-selected template; pass null to revert to the actually selected one. */
  onHoverTemplate: (id: ResumeTemplateId | null) => void;
  /** "Preview" toggles the side preview panel's visibility (was the rail's separate collapse/show button -- consolidated here so there's one control, not two doing overlapping things). */
  previewCollapsed: boolean;
  onToggleCollapsed: () => void;
  /** Opens the fullscreen preview overlay -- the true "view full size" action, distinct from show/hide. Rendered as the last, icon-only item in the row. */
  onFullscreen: () => void;
  /** Scrolls to / triggers the AI Resume Review section on the current page -- omit to hide the AI Review button. */
  onAiReview?: () => void;
}

/**
 * Template picker (dropdown) / Preview (show-hide the side panel) / AI
 * Review / LinkedIn Optimizer / Question Generator / Fullscreen -- sits in
 * the shared sub-header row, right-aligned opposite the formatting toolbar
 * (matching Main.pdf's reference layout). Fullscreen is last, mirroring the
 * reference's icon rail collapsing into the header instead of living beside
 * the preview column.
 */
export default function EditorQuickActions({
  templateId,
  onSelectTemplate,
  onHoverTemplate,
  previewCollapsed,
  onToggleCollapsed,
  onFullscreen,
  onAiReview,
}: EditorQuickActionsProps) {
  const { navigate } = useNav();
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const activeTemplate = RESUME_TEMPLATES.find((t) => t.id === templateId);

  return (
    <div className="editor-toolbar-tools">
      <div className="topbar-download-menu">
        <button
          type="button"
          className="editor-toolbar-tool"
          onClick={() => setTemplateMenuOpen((open) => !open)}
          title="Choose a resume template"
        >
          🎨 Template: {activeTemplate?.name ?? "Classic"}
        </button>
        {templateMenuOpen && (
          <div
            className="topbar-download-options topbar-template-options"
            onMouseLeave={() => onHoverTemplate(null)}
          >
            {RESUME_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={t.id === templateId ? "topbar-template-option active" : "topbar-template-option"}
                onClick={() => {
                  onSelectTemplate(t.id);
                  setTemplateMenuOpen(false);
                }}
                onMouseEnter={() => onHoverTemplate(t.id)}
                title={t.description}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        className={`editor-toolbar-tool${previewCollapsed ? "" : " editor-toolbar-tool-primary"}`}
        onClick={onToggleCollapsed}
        aria-pressed={!previewCollapsed}
        title={previewCollapsed ? "Show the preview panel" : "Hide the preview panel"}
      >
        👁️ Preview
      </button>
      {onAiReview && (
        <button type="button" className="editor-toolbar-tool" onClick={onAiReview}>
          ✨ AI Review
        </button>
      )}
      <button
        type="button"
        className="editor-toolbar-tool"
        onClick={() => navigate({ page: "career-tool", kind: "linkedin-optimization" })}
      >
        in LinkedIn Optimizer
      </button>
      <button
        type="button"
        className="editor-toolbar-tool"
        onClick={() => navigate({ page: "career-tool", kind: "interview-questions" })}
      >
        ❓ Question Generator
      </button>
      <button
        type="button"
        className="editor-toolbar-tool editor-toolbar-tool-icon"
        onClick={onFullscreen}
        aria-label="Open fullscreen preview"
        title="Fullscreen preview"
      >
        ⛶
      </button>
    </div>
  );
}
