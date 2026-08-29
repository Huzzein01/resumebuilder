import type { WorkExperience } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";
import BulletList from "./BulletList.js";
import EntryCardActions from "./EntryCardActions.js";

interface Props {
  entries: WorkExperience[];
  onChange: (entries: WorkExperience[]) => void;
}

export default function WorkExperienceForm({ entries, onChange }: Props) {
  function update(index: number, patch: Partial<WorkExperience>) {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([
      ...entries,
      { id: uuid(), title: "", company: "", startDate: "", endDate: "", bullets: [] },
    ]);
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
    const clone: WorkExperience = {
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
      <h2>Work Experience</h2>
      {entries.map((entry, i) => (
        <div className="entry-card" key={entry.id}>
          <EntryCardActions
            onMoveUp={i > 0 ? () => move(i, -1) : undefined}
            onMoveDown={i < entries.length - 1 ? () => move(i, 1) : undefined}
            onDuplicate={() => duplicate(i)}
            onRemove={() => remove(i)}
            removeLabel="Remove work experience entry"
          />
          <div className="field-row">
            <div className="field">
              <label>Title</label>
              <input value={entry.title} onChange={(e) => update(i, { title: e.target.value })} />
            </div>
            <div className="field">
              <label>Company</label>
              <input
                value={entry.company}
                onChange={(e) => update(i, { company: e.target.value })}
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
        </div>
      ))}
      <button onClick={add}>+ Add Work Experience</button>
    </section>
  );
}
