import type { VolunteerWork } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";
import BulletList from "./BulletList.js";

interface Props {
  entries: VolunteerWork[];
  onChange: (entries: VolunteerWork[]) => void;
}

export default function VolunteerWorkForm({ entries, onChange }: Props) {
  function update(index: number, patch: Partial<VolunteerWork>) {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([
      ...entries,
      { id: uuid(), role: "", organization: "", startDate: "", endDate: "", bullets: [] },
    ]);
  }

  function remove(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <section className="form-section">
      <h2>Volunteer Work</h2>
      {entries.map((entry, i) => (
        <div className="entry-card" key={entry.id}>
          <div className="field-row">
            <div className="field">
              <label>Role</label>
              <input value={entry.role} onChange={(e) => update(i, { role: e.target.value })} />
            </div>
            <div className="field">
              <label>Organization</label>
              <input
                value={entry.organization}
                onChange={(e) => update(i, { organization: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Start Date</label>
              <input
                value={entry.startDate}
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
          </div>
          <BulletList
            bullets={entry.bullets}
            onChange={(bullets) => update(i, { bullets })}
          />
          <div className="entry-card-footer">
            <button className="entry-remove-btn" onClick={() => remove(i)} aria-label="Remove volunteer work entry" title="Remove entry">
              ✕
            </button>
          </div>
        </div>
      ))}
      <button onClick={add}>+ Add Volunteer Work</button>
    </section>
  );
}
