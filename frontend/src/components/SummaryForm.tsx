interface Props {
  summary: string;
  onChange: (summary: string) => void;
}

export default function SummaryForm({ summary, onChange }: Props) {
  return (
    <section className="form-section">
      <h2>Summary</h2>
      <div className="field">
        <textarea
          rows={4}
          placeholder="A brief professional summary..."
          value={summary}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </section>
  );
}
