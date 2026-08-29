import type { Education } from "@resumebuilder/shared";
import { commonDegrees, commonSchools } from "@resumebuilder/shared";
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
      {/* Shared by every entry -- a <datalist> is referenced by id via the
          input's list attribute, so one copy here covers all rows rather
          than duplicating the option list per entry. Suggestions only
          (typing anything else is still accepted); browsers layer their own
          per-field autofill/form-history suggestions on top of this for
          free, which is most of what makes it feel like it "remembers as
          you type" beyond just this curated list. */}
      <datalist id="education-schools">
        {commonSchools.map((school) => (
          <option key={school} value={school} />
        ))}
      </datalist>
      <datalist id="education-degrees">
        {commonDegrees.map((degree) => (
          <option key={degree} value={degree} />
        ))}
      </datalist>
      {entries.map((entry, i) => (
        <div className="field-row" key={entry.id}>
          <div className="field">
            <label>School</label>
            <input
              value={entry.school}
              onChange={(e) => update(i, { school: e.target.value })}
              list="education-schools"
              autoComplete="organization"
            />
          </div>
          <div className="field">
            <label>Degree</label>
            <input
              value={entry.degree}
              onChange={(e) => update(i, { degree: e.target.value })}
              list="education-degrees"
            />
          </div>
          <div className="field">
            <label>Field</label>
            <input value={entry.field} onChange={(e) => update(i, { field: e.target.value })} />
          </div>
          {/* Native date picker (browser renders it in the locale's format,
              e.g. mm/dd/yyyy in en-US) -- stored value is the same
              yyyy-mm-dd string type="date" always uses, same field/type as
              every other date on the profile, just a picker UI instead of
              free text here. A pre-existing entry stored as free text (e.g.
              "2018", from before this change, or from resume import) won't
              match that format and the input shows blank until re-picked;
              nothing is deleted, the underlying value is untouched unless
              edited. */}
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
          <button className="entry-remove-btn" onClick={() => remove(i)} aria-label="Remove education entry" title="Remove">
            ✕
          </button>
        </div>
      ))}
      <button onClick={add}>+ Add Education</button>
    </section>
  );
}
