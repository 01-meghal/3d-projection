export default function ProgressBar({ value = 0, label }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress">
      {label && <div className="progress__label">{label}</div>}
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress__pct">{pct}%</div>
    </div>
  );
}
