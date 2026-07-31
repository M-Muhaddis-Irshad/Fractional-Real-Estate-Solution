import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Stat from "../components/Stat";
import PropertyCard from "../components/PropertyCard";
import { moneyShort } from "../lib/format";

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
  const { properties, notify } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState("All Assets");
  const [sortKey, setSortKey] = useState("featured");
  const [email, setEmail] = useState("");

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

  const totalValue = properties.reduce((s, p) => s + p.totalValue, 0);
  const avgYield = (properties.reduce((s, p) => s + p.yieldPct, 0) / properties.length).toFixed(1);
  const topPerformer = properties.reduce((m, p) => Math.max(m, p.yieldPct), 0).toFixed(1);
  const topYields = [...properties].sort((a, b) => b.yieldPct - a.yieldPct).slice(0, 3);

  const onSearch = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const handleJoin = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    notify("You're on the list. Welcome to Flux.", "success");
    setEmail("");
  };

  return (
    <>
      <section className="hero">
        <div className="marketPill">
          <span className="dot" /> MARKET LIVE: +1.2% TODAY
        </div>
        <h1 className="heroTitle">
          Own a fraction. <span className="accent">Earn the whole return.</span>
        </h1>
        <p className="heroSub">
          Access institutional-grade real estate assets through fractional ownership. Secure,
          transparent, and built for the next generation of global investors.
        </p>
        <div className="heroActions">
          <button className="primaryBtn" onClick={() => scrollTo("marketplace")}>
            Explore Assets
          </button>
          <button className="ghostBtn" onClick={() => scrollTo("how")}>
            How it Works
          </button>
        </div>
        <div className="heroStats">
          <Stat label="Properties Listed" value={properties.length} />
          <Stat label="Total Value" value={moneyShort(totalValue)} />
          <Stat label="Avg. Yield" value={`${avgYield}%`} />
          <Stat label="Top Performer" value={`${topPerformer}%`} />
        </div>
      </section>

      <section className="marketplace" id="marketplace">
        <div className="sectionHead">
          <h2 className="sectionTitle">High Yield</h2>
          <div className="yieldStrip">
            {topYields.map((p) => (
              <span key={p.id} className="yieldChip">
                {p.yieldPct}% APY
              </span>
            ))}
          </div>
        </div>

        <div className="controlsRow">
          <div className="searchBox">
            <span className="searchIcon">⌕</span>
            <input
              placeholder="Search by city, asset type or yield..."
              value={query}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <select className="sortSelect" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>
                {s.label}
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
            <div className="emptyTitle">No assets match that search.</div>
            <div className="emptySub">Try a different keyword or clear your filters.</div>
          </div>
        ) : (
          <div className="grid">
            {visible.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      <section className="feature" id="how">
        <div className="featureLeft">
          <h2 className="featureTitle">
            Institutional Security.
            <br />
            <span className="accent">Retail Accessibility.</span>
          </h2>
          <p className="featureText">
            Every property is vetted by our expert team and managed through smart contracts on the
            Ledger, ensuring your ownership is immutable and your dividends are automatic.
          </p>
          <div className="trustRow">
            <div className="trustBadge">SEC REGISTERED</div>
            <div className="trustBadge">$250M INSURANCE</div>
            <div className="trustBadge">AES-256 ENCRYPTED</div>
          </div>
        </div>
        <div className="featureCard">
          <div className="featureCardHead">
            <div className="avatarLetter">A</div>
            <div>
              <div className="sidebarUserName">Alex Vance</div>
              <div className="sidebarUserRole">PRO Investor</div>
            </div>
          </div>
          <div className="featureQuote">
            "The world's premier gateway to fractional real estate liquidity."
          </div>
          <div className="featureStats">
            <div className="featureStat">
              <div className="statValue">{moneyShort(totalValue)}</div>
              <div className="statLabel">Assets Tokenized</div>
            </div>
            <div className="featureStat">
              <div className="statValue">{properties.length}</div>
              <div className="statLabel">Properties Live</div>
            </div>
            <div className="featureStat">
              <div className="statValue">{avgYield}%</div>
              <div className="statLabel">Avg. Yield</div>
            </div>
          </div>
        </div>
      </section>

      <section className="waitlist">
        <div className="waitlistInner">
          <h2 className="waitlistTitle">Global Waitlist</h2>
          <p className="waitlistSub">Join investors redefining how the world owns real estate.</p>
          <form className="waitlistForm" onSubmit={handleJoin}>
            <input
              className="waitlistInput"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="primaryBtn" type="submit">
              Join Waitlist
            </button>
          </form>
          <div className="waitlistNote">By joining, you agree to our Investor Policy.</div>
        </div>
      </section>
    </>
  );
}
