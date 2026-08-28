import type { TestScore } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";

interface Props {
  entries: TestScore[];
  onChange: (entries: TestScore[]) => void;
}

export default function TestScoresForm({ entries, onChange }: Props) {
  function update(index: number, patch: Partial<TestScore>) {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([...entries, { id: uuid(), name: "", score: "", date: "" }]);
  }

  function remove(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <section className="form-section">
      <h2>Test Scores</h2>
      {entries.map((entry, i) => (
        <div className="field-row" key={entry.id}>
          <div className="field">
            <label>Test Name</label>
            <input
              value={entry.name}
              placeholder="SAT, GRE, TOEFL..."
              onChange={(e) => update(i, { name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Score</label>
            <input value={entry.score} onChange={(e) => update(i, { score: e.target.value })} />
          </div>
          <div className="field">
            <label>Date</label>
            <input value={entry.date ?? ""} onChange={(e) => update(i, { date: e.target.value })} />
          </div>
          <button className="entry-remove-btn" onClick={() => remove(i)} aria-label="Remove test score" title="Remove">
            ✕
          </button>
        </div>
      ))}
      <button onClick={add}>+ Add Test Score</button>
    </section>
  );
}
