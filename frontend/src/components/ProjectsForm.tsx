import type { ProjectEntry } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";
import BulletList from "./BulletList.js";

interface Props {
  entries: ProjectEntry[];
  onChange: (entries: ProjectEntry[]) => void;
}

export default function ProjectsForm({ entries, onChange }: Props) {
  function update(index: number, patch: Partial<ProjectEntry>) {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([
      ...entries,
      { id: uuid(), name: "", startDate: "", endDate: "", techStack: [], bullets: [] },
    ]);
  }

  function remove(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  function setTechStack(index: number, value: string) {
    update(index, {
      techStack: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <section className="form-section">
      <h2>Projects</h2>
      {entries.map((entry, i) => (
        <div className="entry-card" key={entry.id}>
          <div className="field-row">
            <div className="field">
              <label>Name</label>
              <input value={entry.name} onChange={(e) => update(i, { name: e.target.value })} />
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
            <div className="field">
              <label>Tech Stack (comma-separated)</label>
              <input
                value={entry.techStack.join(", ")}
                onChange={(e) => setTechStack(i, e.target.value)}
              />
            </div>
          </div>
          <BulletList bullets={entry.bullets} onChange={(bullets) => update(i, { bullets })} />
          <button className="danger" onClick={() => remove(i)}>
            Remove Project
          </button>
        </div>
      ))}
      <button onClick={add}>+ Add Project</button>
    </section>
  );
}
