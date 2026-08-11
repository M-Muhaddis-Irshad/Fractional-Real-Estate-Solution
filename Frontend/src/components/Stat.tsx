import type { ReactNode } from "react";

interface StatProps {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  tone?: "up" | "down" | "neutral";
}

export default function Stat({ label, value, delta, tone = "neutral" }: StatProps) {
  const deltaCls = tone === "up" ? "kpiUp" : tone === "down" ? "kpiDown" : "kpiNeutral";
  return (
    <div className="kpi">
      <div className="kpiLabel">{label}</div>
      <div className="kpiValue">{value}</div>
      {delta != null && <div className={`kpiDelta ${deltaCls}`}>{delta}</div>}
    </div>
  );
}
