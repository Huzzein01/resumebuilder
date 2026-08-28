import type { ReferenceEntry } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";

interface Props {
  entries: ReferenceEntry[];
  onChange: (entries: ReferenceEntry[]) => void;
}

export default function ReferencesForm({ entries, onChange }: Props) {
  function update(index: number, patch: Partial<ReferenceEntry>) {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([...entries, { id: uuid(), name: "", relationship: "", email: "", phone: "" }]);
  }

  function remove(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <section className="form-section">
      <h2>References</h2>
      {entries.map((entry, i) => (
        <div className="field-row" key={entry.id}>
          <div className="field">
            <label>Name</label>
            <input value={entry.name} onChange={(e) => update(i, { name: e.target.value })} />
          </div>
          <div className="field">
            <label>Relationship</label>
            <input
              value={entry.relationship}
              placeholder="Former manager..."
              onChange={(e) => update(i, { relationship: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={entry.email ?? ""} onChange={(e) => update(i, { email: e.target.value })} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={entry.phone ?? ""} onChange={(e) => update(i, { phone: e.target.value })} />
          </div>
          <button className="entry-remove-btn" onClick={() => remove(i)} aria-label="Remove reference" title="Remove">
            ✕
          </button>
        </div>
      ))}
      <button onClick={add}>+ Add Reference</button>
    </section>
  );
}
