"use client";

import { useApp } from "@/context/AppContext";
import type { StatItem } from "@/lib/types";

/**
 * Shared access to the admin-editable homepage stats (content.stats) — the
 * single source of truth for platform numbers like Total Value, Avg. Yield and
 * Active Investors. Pages that previously hardcoded these numbers (auth side
 * panels, Our Story) read them through this hook instead.
 */
export function useSiteStats(): StatItem[] {
  return useApp().content?.stats || [];
}

/** Find a stat's value by label, or undefined when the stat doesn't exist. */
export function statValue(stats: StatItem[], label: string): string | undefined {
  return stats.find((s) => s.label === label)?.value;
}
