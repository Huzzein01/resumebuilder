import { useState } from "react";
import { RESUME_TEMPLATES, type ResumeTemplateId } from "@resumebuilder/shared";
import { useNav } from "../shell/NavContext.js";

interface EditorQuickActionsProps {
  templateId: ResumeTemplateId;
  onSelectTemplate: (id: ResumeTemplateId) => void;
  /** Live-swaps the preview to a hovered-but-not-yet-selected template; pass null to revert to the actually selected one. */
  onHoverTemplate: (id: ResumeTemplateId | null) => void;
  /** Toggles the fullscreen resume preview overlay -- omit to hide the Preview button (e.g. on pages with no resume to preview yet). */
  onPreview?: () => void;
  /** Scrolls to / triggers the AI Resume Review section on the current page -- omit to hide the AI Review button. */
  onAiReview?: () => void;
}

/**
 * Template picker (dropdown, replacing the old standalone row of template
 * buttons stacked above the preview) / Preview / AI Review / LinkedIn
 * Optimizer / Question Generator -- sits in the shared top row above the
 * editor/preview columns, right-aligned over the preview column (matching
 * Main.pdf's reference layout), rather than inside the formatting toolbar
 * or as its own block in the preview column. See EditorToolbar for the
 * formatting controls that share this row on the editor-column side.
 */
export default function EditorQuickActions({
  templateId,
  onSelectTemplate,
  onHoverTemplate,
  onPreview,
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
      {onPreview && (
        <button type="button" className="editor-toolbar-tool editor-toolbar-tool-primary" onClick={onPreview}>
          👁️ Preview
        </button>
      )}
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
    </div>
  );
}
