import { useEffect, useRef } from "react";
import { sanitizeRichText } from "@resumebuilder/shared";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

/**
 * contentEditable surface for the small formatting set the toolbar exposes
 * (bold/italic/underline). Content is sanitized to that same allowed-tag set
 * on every change, so what's stored can never drift from what parseRichText
 * (shared with the DOCX exporter) knows how to interpret.
 *
 * Deliberately uncontrolled while focused -- React re-rendering innerHTML on
 * every keystroke would fight the browser's own cursor/selection state. The
 * DOM is only synced from `value` when it's out of focus (e.g. external
 * updates) or on first mount.
 */
export default function RichTextField({ value, onChange, placeholder, multiline, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  useEffect(() => {
    if (isFocused.current) return;
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function handleInput() {
    if (!ref.current) return;
    onChange(sanitizeRichText(ref.current.innerHTML));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
    }
  }

  return (
    <div
      ref={ref}
      className={`richtext-field${className ? ` ${className}` : ""}`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={handleInput}
      onFocus={() => (isFocused.current = true)}
      onBlur={() => {
        isFocused.current = false;
        handleInput();
      }}
      onKeyDown={handleKeyDown}
    />
  );
}
