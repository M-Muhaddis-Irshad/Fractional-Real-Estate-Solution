export default function Stat({ label, value, delta, tone = "neutral" }) {
  const deltaCls =
    tone === "up" ? "kpiUp" : tone === "down" ? "kpiDown" : "kpiNeutral";
  return (
    <div className="kpi">
      <div className="kpiLabel">{label}</div>
      <div className="kpiValue">{value}</div>
      {delta != null && <div className={`kpiDelta ${deltaCls}`}>{delta}</div>}
    </div>
  );
}
