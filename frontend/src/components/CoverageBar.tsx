interface Props {
  label: string;
  value: number;
}

export default function CoverageBar({ label, value }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="coverage-bar">
      <div className="coverage-bar-head">
        <span>{label}</span>
        <span className="mono">{clamped}%</span>
      </div>
      <div className="coverage-bar-track">
        <div className="coverage-bar-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
