import { useEffect, useState } from "react";

/**
 * Rich-text formatting toolbar -- acts on whatever text is currently
 * selected inside any contentEditable region on the page (one toolbar, not
 * one per field). Sits at the left edge of the shell's full-width sub-header
 * band, opposite EditorQuickActions at the right edge -- split into two
 * components so ProfileEditor can register them as one nav row spanning the
 * whole window (matching Main.pdf's reference).
 *
 * The formatting buttons are enabled only while a rich-text field actually
 * has focus. Only bullet/description text is rich text; plain fields (name,
 * email, company, dates...) are ordinary <input>s that execCommand cannot
 * touch. Without this gating the buttons look live on every section but
 * silently do nothing on most of them -- which reads as a broken feature
 * rather than an inapplicable one.
 *
 * One thing intentionally not implemented here, rather than faked:
 * inline comments/annotations -- a real feature (threads, persistence,
 * resolution), not a toolbar button; not built in this pass.
 */
export default function EditorToolbar() {
  const [richTextFocused, setRichTextFocused] = useState(false);

  useEffect(() => {
    function sync() {
      const el = document.activeElement;
      setRichTextFocused(!!el && el instanceof HTMLElement && el.classList.contains("richtext-field"));
    }
    sync();
    // focusin/focusout bubble (unlike focus/blur), so one pair of document
    // listeners covers every RichTextField on the page, including ones added
    // later by "+ Add Bullet" -- no per-field wiring or re-subscription.
    // selectionchange is the self-healing one: focusout fires with
    // activeElement transiently on <body> (e.g. the window losing focus),
    // which would otherwise latch the toolbar off even though the caret is
    // still sitting in a bullet. Any caret activity re-derives the truth.
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    document.addEventListener("selectionchange", sync);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
      document.removeEventListener("selectionchange", sync);
    };
  }, []);

  const disabledHint = richTextFocused
    ? undefined
    : "Click into a bullet or description first — plain fields like name and dates can't be formatted";

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
        title={disabledHint ?? "Bold"}
        aria-label="Bold"
        className="editor-toolbar-bold"
        disabled={!richTextFocused}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run("bold")}
      >
        B
      </button>
      <button
        type="button"
        title={disabledHint ?? "Italic"}
        aria-label="Italic"
        className="editor-toolbar-italic"
        disabled={!richTextFocused}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run("italic")}
      >
        I
      </button>
      <button
        type="button"
        title={disabledHint ?? "Underline"}
        aria-label="Underline"
        className="editor-toolbar-underline"
        disabled={!richTextFocused}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run("underline")}
      >
        U
      </button>
      <button
        type="button"
        title={disabledHint ?? "Bulleted list"}
        aria-label="Insert bullet"
        disabled={!richTextFocused}
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertBullet}
      >
        ☰•
      </button>
    </div>
  );
}
