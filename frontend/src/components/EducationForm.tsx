import type { Education } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";

interface Props {
  entries: Education[];
  onChange: (entries: Education[]) => void;
}

export default function EducationForm({ entries, onChange }: Props) {
  function update(index: number, patch: Partial<Education>) {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([
      ...entries,
      { id: uuid(), school: "", degree: "", field: "", startDate: "", endDate: "" },
    ]);
  }

  function remove(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <section className="form-section">
      <h2>Education</h2>
      {entries.map((entry, i) => (
        <div className="field-row" key={entry.id}>
          <div className="field">
            <label>School</label>
            <input value={entry.school} onChange={(e) => update(i, { school: e.target.value })} />
          </div>
          <div className="field">
            <label>Degree</label>
            <input value={entry.degree} onChange={(e) => update(i, { degree: e.target.value })} />
          </div>
          <div className="field">
            <label>Field</label>
            <input value={entry.field} onChange={(e) => update(i, { field: e.target.value })} />
          </div>
          <div className="field">
            <label>Start Date</label>
            <input
              value={entry.startDate ?? ""}
              onChange={(e) => update(i, { startDate: e.target.value })}
            />
          </div>
          <div className="field">
            <label>End Date</label>
            <input
              value={entry.endDate ?? ""}
              onChange={(e) => update(i, { endDate: e.target.value })}
            />
          </div>
          <button className="entry-remove-btn" onClick={() => remove(i)} aria-label="Remove education entry" title="Remove">
            ✕
          </button>
        </div>
      ))}
      <button onClick={add}>+ Add Education</button>
    </section>
  );
}
