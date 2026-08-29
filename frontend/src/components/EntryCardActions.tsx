interface EntryCardActionsProps {
  /** Omit (or leave undefined) to disable -- e.g. the first entry has no "move up". */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  /** Accessible label for the remove button, e.g. "Remove work experience entry". */
  removeLabel: string;
}

/**
 * Small icon-button cluster at the top of an entry-card: reorder (up/down --
 * real drag-and-drop would need a new dependency this app doesn't have;
 * these buttons give the same practical reordering without that), duplicate,
 * and remove. Shared by the four entry-card-based forms (WorkExperience,
 * Projects, VolunteerWork, SimpleEntryForm) where entry order actually
 * matters (chronological/relevance) and duplicating a similar role/project
 * saves retyping -- not added to the simpler field-row forms (Certifications,
 * Skills, etc.) where order is usually irrelevant.
 */
export default function EntryCardActions({ onMoveUp, onMoveDown, onDuplicate, onRemove, removeLabel }: EntryCardActionsProps) {
  return (
    <div className="entry-card-toolbar">
      <button
        type="button"
        className="entry-icon-btn"
        onClick={onMoveUp}
        disabled={!onMoveUp}
        aria-label="Move up"
        title="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        className="entry-icon-btn"
        onClick={onMoveDown}
        disabled={!onMoveDown}
        aria-label="Move down"
        title="Move down"
      >
        ↓
      </button>
      <button type="button" className="entry-icon-btn" onClick={onDuplicate} aria-label="Duplicate entry" title="Duplicate">
        ⧉
      </button>
      <button
        type="button"
        className="entry-icon-btn entry-icon-btn-danger"
        onClick={onRemove}
        aria-label={removeLabel}
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}
