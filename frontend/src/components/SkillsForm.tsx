import type { Skill } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";

interface Props {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}

export default function SkillsForm({ skills, onChange }: Props) {
  function update(index: number, patch: Partial<Skill>) {
    const next = [...skills];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([...skills, { id: uuid(), name: "", category: "", aliases: [] }]);
  }

  function remove(index: number) {
    onChange(skills.filter((_, i) => i !== index));
  }

  function setAliases(index: number, value: string) {
    update(index, {
      aliases: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <section className="form-section">
      <h2>Skills</h2>
      {skills.map((skill, i) => (
        <div className="field-row" key={skill.id}>
          <div className="field">
            <label>Name</label>
            <input value={skill.name} onChange={(e) => update(i, { name: e.target.value })} />
          </div>
          <div className="field">
            <label>Category</label>
            <input
              value={skill.category}
              onChange={(e) => update(i, { category: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Aliases (comma-separated)</label>
            <input value={skill.aliases.join(", ")} onChange={(e) => setAliases(i, e.target.value)} />
          </div>
          <button className="danger" onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={add}>+ Add Skill</button>
    </section>
  );
}
