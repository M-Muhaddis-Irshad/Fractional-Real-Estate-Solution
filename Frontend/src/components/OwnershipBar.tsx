interface OwnershipBarProps {
  sold: number;
  total: number;
}

export default function OwnershipBar({ sold, total }: OwnershipBarProps) {
  const pct = total > 0 ? Math.min(100, (sold / total) * 100) : 0;
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progressFill" style={{ width: `${pct}%` }} />
    </div>
  );
}
