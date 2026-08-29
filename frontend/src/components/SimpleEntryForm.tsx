import type { SimpleEntry } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";
import BulletList from "./BulletList.js";
import EntryCardActions from "./EntryCardActions.js";

interface Props {
  title: string;
  entries: SimpleEntry[];
  onChange: (entries: SimpleEntry[]) => void;
  titleLabel?: string;
  subtitleLabel?: string;
  addLabel?: string;
  /** Hide the date fields for sections where they don't make sense (e.g. Patents can use dates, but some sections may not need a range). */
  showDates?: boolean;
}

/**
 * One reusable form for every profile section shaped like "a title, an
 * optional org/subtitle, an optional date range, and some bullet points" --
 * Research Experience, Leadership, Extra Curricular Activities,
 * Associations, Awards & Honors, Conferences/Presentations, Courses, and
 * Patents all render through this instead of eight near-identical
 * components.
 */
export default function SimpleEntryForm({
  title,
  entries,
  onChange,
  titleLabel = "Title",
  subtitleLabel = "Organization",
  addLabel,
  showDates = true,
}: Props) {
  function update(index: number, patch: Partial<SimpleEntry>) {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([...entries, { id: uuid(), title: "", subtitle: "", startDate: "", endDate: "", bullets: [] }]);
  }

  function remove(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= entries.length) return;
    const next = [...entries];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function duplicate(index: number) {
    const source = entries[index];
    const clone: SimpleEntry = {
      ...source,
      id: uuid(),
      bullets: source.bullets.map((b) => ({ ...b, id: uuid() })),
    };
    const next = [...entries];
    next.splice(index + 1, 0, clone);
    onChange(next);
  }

  return (
    <section className="form-section">
      <h2>{title}</h2>
      {entries.map((entry, i) => (
        <div className="entry-card" key={entry.id}>
          <EntryCardActions
            onMoveUp={i > 0 ? () => move(i, -1) : undefined}
            onMoveDown={i < entries.length - 1 ? () => move(i, 1) : undefined}
            onDuplicate={() => duplicate(i)}
            onRemove={() => remove(i)}
            removeLabel={`Remove ${title.toLowerCase()} entry`}
          />
          <div className="field-row">
            <div className="field">
              <label>{titleLabel}</label>
              <input value={entry.title} onChange={(e) => update(i, { title: e.target.value })} />
            </div>
            <div className="field">
              <label>{subtitleLabel}</label>
              <input value={entry.subtitle ?? ""} onChange={(e) => update(i, { subtitle: e.target.value })} />
            </div>
            {showDates && (
              <>
                <div className="field">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={entry.startDate ?? ""}
                    onChange={(e) => update(i, { startDate: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={entry.endDate ?? ""}
                    onChange={(e) => update(i, { endDate: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <BulletList bullets={entry.bullets} onChange={(bullets) => update(i, { bullets })} />
        </div>
      ))}
      <button onClick={add}>+ {addLabel ?? `Add ${title}`}</button>
    </section>
  );
}
