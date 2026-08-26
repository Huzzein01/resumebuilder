import type { Certification } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";

interface Props {
  entries: Certification[];
  onChange: (entries: Certification[]) => void;
}

export default function CertificationsForm({ entries, onChange }: Props) {
  function update(index: number, patch: Partial<Certification>) {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([...entries, { id: uuid(), name: "", issuer: "", date: "" }]);
  }

  function remove(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <section className="form-section">
      <h2>Certifications</h2>
      {entries.map((entry, i) => (
        <div className="field-row" key={entry.id}>
          <div className="field">
            <label>Name</label>
            <input value={entry.name} onChange={(e) => update(i, { name: e.target.value })} />
          </div>
          <div className="field">
            <label>Issuer</label>
            <input value={entry.issuer} onChange={(e) => update(i, { issuer: e.target.value })} />
          </div>
          <div className="field">
            <label>Date</label>
            <input value={entry.date ?? ""} onChange={(e) => update(i, { date: e.target.value })} />
          </div>
          <button className="danger" onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={add}>+ Add Certification</button>
    </section>
  );
}
