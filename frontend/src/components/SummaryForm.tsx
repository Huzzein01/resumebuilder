import RichTextField from "./RichTextField.js";

interface Props {
  summary: string;
  onChange: (summary: string) => void;
}

export default function SummaryForm({ summary, onChange }: Props) {
  return (
    <section className="form-section">
      <h2>Summary</h2>
      <div className="field">
        <RichTextField
          value={summary}
          onChange={onChange}
          placeholder="A brief professional summary..."
          multiline
          className="richtext-summary"
        />
      </div>
    </section>
  );
}
