"use client";

import { statValue, useSiteStats } from "@/lib/useSiteStats";

/**
 * Platform stats in the auth side-panel footer — reads from the same
 * admin-editable content.stats as the homepage, so there are no hardcoded
 * number copies across the auth pages.
 */
export default function AuthSideStats() {
  const stats = useSiteStats();
  const row = [
    { v: statValue(stats, "Total Value"), l: "Assets listed" },
    { v: statValue(stats, "Active Investors"), l: "Investors" },
    { v: statValue(stats, "Avg. Yield"), l: "Avg. yield" },
  ].filter((s): s is { v: string; l: string } => Boolean(s.v));
  if (row.length === 0) return null;
  return (
    <div className="authSideFoot">
      {row.map((s) => (
        <div className="authSideStat" key={s.l}>
          <div className="authSideStatVal">{s.v}</div>
          <div className="authSideStatLabel">{s.l}</div>
        </div>
      ))}
    </div>
  );
}
