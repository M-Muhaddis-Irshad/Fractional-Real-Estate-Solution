import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import Stat from "../components/Stat";
import PropertyCard from "../components/PropertyCard";
import { money } from "../lib/format";

const SORTS = {
  featured: { label: "Featured", fn: () => 0 },
  yieldDesc: { label: "Highest yield", fn: (a, b) => b.yieldPct - a.yieldPct },
  priceAsc: { label: "Lowest share price", fn: (a, b) => a.pricePerShare - b.pricePerShare },
  mostFunded: {
    label: "Most funded",
    fn: (a, b) => b.soldShares / b.totalShares - a.soldShares / a.totalShares,
  },
};

export default function Discover() {
  const { properties } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortKey, setSortKey] = useState("featured");

  const types = useMemo(() => ["All", ...new Set(properties.map((p) => p.type))], [properties]);

  const visible = useMemo(() => {
    let list = properties;
    if (filter !== "All") list = list.filter((p) => p.type === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
      );
    }
    return [...list].sort(SORTS[sortKey].fn);
  }, [properties, filter, query, sortKey]);

  const avgYield = (properties.reduce((s, p) => s + p.yieldPct, 0) / properties.length).toFixed(1);

  return (
    <>
      <section className="hero">
        <h1 className="heroTitle">
          Own a fraction. <span className="accent">Earn the whole return.</span>
        </h1>
        <p className="heroSub">
          Buy verified shares in income-producing property across Pakistan — starting well below
          the price of a single brick-and-mortar deal.
        </p>
        <div className="heroStats">
          <Stat label="Properties listed" value={properties.length} />
          <Stat label="Combined value" value={money(properties.reduce((s, p) => s + p.totalValue, 0))} />
          <Stat label="Avg. yield" value={`${avgYield}%`} />
        </div>
      </section>

      <div className="controlsRow">
        <input
          className="searchInput"
          placeholder="Search by property or city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="sortSelect" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filterRow">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={"filterChip" + (filter === t ? " filterChipActive" : "")}
          >
            {t}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <div className="emptyTitle">No properties match that search.</div>
          <div className="emptySub">Try a different keyword or clear your filters.</div>
        </div>
      ) : (
        <div className="grid">
          {visible.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </>
  );
}
