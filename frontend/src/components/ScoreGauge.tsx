interface Props {
  score: number;
  size?: number;
}

export default function ScoreGauge({ score, size = 132 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const good = clamped >= 70;

  return (
    <div className="score-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={good ? "var(--primary)" : "var(--accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-gauge-center">
        <span className="score-gauge-num">{Math.round(clamped)}</span>
        <span className="score-gauge-suffix">/ 100</span>
      </div>
    </div>
  );
}
