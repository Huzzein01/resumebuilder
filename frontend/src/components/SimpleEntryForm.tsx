import type { SimpleEntry } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";
import BulletList from "./BulletList.js";

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

  return (
    <section className="form-section">
      <h2>{title}</h2>
      {entries.map((entry, i) => (
        <div className="entry-card" key={entry.id}>
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
                  <input value={entry.startDate ?? ""} onChange={(e) => update(i, { startDate: e.target.value })} />
                </div>
                <div className="field">
                  <label>End Date</label>
                  <input value={entry.endDate ?? ""} onChange={(e) => update(i, { endDate: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <BulletList bullets={entry.bullets} onChange={(bullets) => update(i, { bullets })} />
          <div className="entry-card-footer">
            <button className="entry-remove-btn" onClick={() => remove(i)} aria-label={`Remove ${title.toLowerCase()} entry`} title="Remove entry">
              ✕
            </button>
          </div>
        </div>
      ))}
      <button onClick={add}>+ {addLabel ?? `Add ${title}`}</button>
    </section>
  );
}
