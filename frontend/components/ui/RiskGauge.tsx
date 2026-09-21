export default function RiskGauge({
  score,
  size = 160,
}: {
  score: number;
  size?: number;
}) {
  const value = Math.max(0, Math.min(10, score));
  const color =
    value >= 9
      ? "var(--critical)"
      : value >= 7
        ? "var(--high)"
        : value >= 4
          ? "var(--medium)"
          : "var(--low)";
  const label =
    value >= 9
      ? "Critical"
      : value >= 7
        ? "High"
        : value >= 4
          ? "Medium"
          : "Low";
  return (
    <div
      className="risk-gauge"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Risk score ${value.toFixed(1)} out of 10, ${label}`}
    >
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle
          cx="80"
          cy="80"
          r="66"
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
        />
        <circle
          cx="80"
          cy="80"
          r="66"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${(value / 10) * 414.7} 414.7`}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div>
        <strong style={{ color }}>{value.toFixed(1)}</strong>
        <span>{label} risk</span>
        <small>out of 10</small>
      </div>
    </div>
  );
}
