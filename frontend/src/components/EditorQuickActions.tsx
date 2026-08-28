import { useNav } from "../shell/NavContext.js";

interface EditorQuickActionsProps {
  /** Toggles the fullscreen resume preview overlay -- omit to hide the Preview button (e.g. on pages with no resume to preview yet). */
  onPreview?: () => void;
  /** Scrolls to / triggers the AI Resume Review section on the current page -- omit to hide the AI Review button. */
  onAiReview?: () => void;
}

/**
 * Preview / AI Review / LinkedIn Optimizer / Question Generator -- sits in
 * the shared top row above the editor/preview columns, right-aligned over
 * the preview column (matching Main.pdf's reference layout), rather than
 * inside the formatting toolbar itself. See EditorToolbar for the
 * formatting controls that share this row on the editor-column side.
 */
export default function EditorQuickActions({ onPreview, onAiReview }: EditorQuickActionsProps) {
  const { navigate } = useNav();

  return (
    <div className="editor-toolbar-tools">
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
