import { useNav } from "../shell/NavContext.js";

interface EditorToolbarProps {
  /** Toggles the fullscreen resume preview overlay -- omit to hide the Preview button (e.g. on pages with no resume to preview yet). */
  onPreview?: () => void;
  /** Scrolls to / triggers the AI Resume Review section on the current page -- omit to hide the AI Review button. */
  onAiReview?: () => void;
}

/**
 * Formatting toolbar for RichTextField instances on the page (acts on
 * whatever text is currently selected inside any contentEditable region --
 * one toolbar, not one per field), plus quick-access buttons to the other
 * resume tools, matching the reference design's editor header.
 *
 * Two things intentionally not implemented here, rather than faked:
 * - Bulleted-list formatting inside a single rich-text field: each bullet
 *   is already its own list item at the data level (BulletList's "+ Add
 *   Bullet"), and our RichText sanitizer only recognizes bold/italic/
 *   underline -- an execCommand("insertUnorderedList") button would
 *   silently produce markup the sanitizer immediately strips back out.
 * - Inline comments/annotations: a real feature (threads, persistence,
 *   resolution), not a toolbar button; not built in this pass.
 */
export default function EditorToolbar({ onPreview, onAiReview }: EditorToolbarProps) {
  const { navigate } = useNav();

  function run(command: string) {
    document.execCommand(command);
  }

  return (
    <div className="editor-toolbar-row">
      <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run("undo")}
        >
          ↺
        </button>
        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run("redo")}
        >
          ↻
        </button>
        <span className="editor-toolbar-divider" aria-hidden="true" />
        <button
          type="button"
          title="Bold"
          aria-label="Bold"
          className="editor-toolbar-bold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run("bold")}
        >
          B
        </button>
        <button
          type="button"
          title="Italic"
          aria-label="Italic"
          className="editor-toolbar-italic"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run("italic")}
        >
          I
        </button>
        <button
          type="button"
          title="Underline"
          aria-label="Underline"
          className="editor-toolbar-underline"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run("underline")}
        >
          U
        </button>
      </div>

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
    </div>
  );
}
