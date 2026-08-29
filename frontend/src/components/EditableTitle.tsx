import { useEffect, useRef, useState } from "react";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * The Resume Builder's document title (e.g. "Senior Product Designer --
 * Resume"), editable inline via a pencil icon -- click the pencil or the
 * title itself to turn it into a text input; Enter or blur commits, Escape
 * reverts. Distinct from Contact Info's Name field (the person's own name);
 * this is just a label for the document, same idea as a filename. Changes
 * flow through the same onChange -> setProfile -> Save flow as every other
 * field on this page, not an autosave -- consistent with the rest of the
 * form.
 */
export default function EditableTitle({ value, onChange }: EditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="editable-title-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        aria-label="Document title"
      />
    );
  }

  return (
    <h1 className="page-title editable-title" onClick={() => setEditing(true)}>
      {value}
      <button
        type="button"
        className="editable-title-pencil"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        aria-label="Edit document title"
        title="Edit title"
      >
        ✏️
      </button>
    </h1>
  );
}
