"use client";

import { useMemo, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import PropertyCard from "@/components/PropertyCard";
import EmptyState from "@/components/EmptyState";
import type { Property } from "@/lib/types";

const SORTS: Record<string, { label: string; fn: (a: Property, b: Property) => number }> = {
  featured: { label: "Featured", fn: () => 0 },
  yieldDesc: { label: "Highest yield", fn: (a, b) => b.yieldPct - a.yieldPct },
  priceAsc: { label: "Lowest share price", fn: (a, b) => a.pricePerShare - b.pricePerShare },
  mostFunded: {
    label: "Most funded",
    fn: (a, b) => b.soldShares / b.totalShares - a.soldShares / a.totalShares,
  },
  newest: {
    label: "Newest",
    fn: (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  },
};

export default function Discover() {
  const { properties } = useApp();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [filter, setFilter] = useState("All Assets");
  const [sortKey, setSortKey] = useState("featured");

  const query = searchParams.get("q") || "";

  const types = useMemo(
    () => ["All Assets", ...new Set(properties.map((p) => p.type))],
    [properties]
  );

  const visible = useMemo(() => {
    let list = properties;
    if (filter !== "All Assets") list = list.filter((p) => p.type === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
      );
    }
    return [...list].sort(SORTS[sortKey].fn);
  }, [properties, filter, query, sortKey]);

  const onSearch = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Marketplace</div>
          <h1 className="pageTitle">Discover assets</h1>
          <p className="pageSub">Institutional-grade real estate, open to everyone.</p>
        </div>
        <select
          className="select dSortSelect"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
        >
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="dDiscoverBar">
        <div className="searchBox">
          <span className="searchIcon">⌕</span>
          <input
            className="input"
            placeholder="Search by city, asset type or yield..."
            value={query}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="pillRow">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={"pill" + (filter === t ? " pillActive" : "")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="⌕"
            title="No assets match your search"
            sub="Try a different keyword or clear your filters."
          />
        </div>
      ) : (
        <div className="dPropGrid">
          {visible.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
