interface Props {
  title: string;
  helpText?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/** Simple string-list editor shared by Languages and Hobbies & Interests. */
export default function TagListForm({ title, helpText, tags, onChange, placeholder }: Props) {
  function update(index: number, value: string) {
    const next = [...tags];
    next[index] = value;
    onChange(next);
  }

  function add() {
    onChange([...tags, ""]);
  }

  function remove(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <section className="form-section">
      <h2>{title}</h2>
      {helpText && <p className="status">{helpText}</p>}
      {tags.map((tag, i) => (
        <div className="field-row" key={i}>
          <div className="field">
            <input value={tag} placeholder={placeholder} onChange={(e) => update(i, e.target.value)} />
          </div>
          <button className="entry-remove-btn" onClick={() => remove(i)} aria-label="Remove item" title="Remove">
            ✕
          </button>
        </div>
      ))}
      <button onClick={add}>+ Add</button>
    </section>
  );
}
