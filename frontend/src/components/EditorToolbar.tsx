/**
 * Formatting toolbar for RichTextField instances on the page. Acts on
 * whatever text is currently selected inside any contentEditable region --
 * there's one toolbar, not one per field, matching how a real document
 * editor's toolbar works. `onMouseDown` preventDefault keeps focus (and the
 * selection) inside the field being edited; without it, clicking a button
 * would blur the field first and the command would have nothing to act on.
 */
export default function EditorToolbar() {
  function run(command: string) {
    document.execCommand(command);
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
    </div>
  );
}
