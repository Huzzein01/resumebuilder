/**
 * Rich-text formatting toolbar -- acts on whatever text is currently
 * selected inside any contentEditable region on the page (one toolbar, not
 * one per field). Sits in the shared top row above the editor/preview
 * columns, alongside EditorQuickActions -- split into two components so
 * ProfileEditor can lay them out on one row spanning both columns (matching
 * Main.pdf's reference), each aligned under its own column below.
 *
 * One thing intentionally not implemented here, rather than faked:
 * inline comments/annotations -- a real feature (threads, persistence,
 * resolution), not a toolbar button; not built in this pass.
 */
export default function EditorToolbar() {
  function run(command: string) {
    document.execCommand(command);
  }

  /**
   * Deliberately not execCommand("insertUnorderedList"): that produces real
   * <ul><li> DOM, which the RichText sanitizer (only b/i/u are in its
   * allowed-tag set, shared with the DOCX exporter so both stay in sync)
   * would silently strip back out on the next save. Instead this inserts a
   * literal "• " at the cursor -- plain text, so it round-trips through
   * sanitizeRichText/parseRichText/the DOCX exporter exactly like any other
   * character, with no schema changes needed anywhere.
   */
  function insertBullet() {
    document.execCommand("insertText", false, "• ");
  }

  return (
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
      <button
        type="button"
        title="Bulleted list"
        aria-label="Insert bullet"
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertBullet}
      >
        ☰•
      </button>
    </div>
  );
}
