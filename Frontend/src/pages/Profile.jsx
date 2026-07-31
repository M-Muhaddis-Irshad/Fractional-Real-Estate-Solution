import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Stat from "../components/Stat";
import { money } from "../lib/format";

export default function Profile() {
  const { properties, holdings, transactions, portfolioTotals, wallet } = useApp();

  const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p]));

  const holdingsWithDetail = holdings.map((h) => {
    const prop = propertyMap[h.propertyId];
    const currentPrice = prop ? prop.pricePerShare : 0;
    const avgPrice = h.invested / h.shares;
    const change = currentPrice - avgPrice;
    const changePct = avgPrice > 0 ? ((change / avgPrice) * 100).toFixed(1) : 0;
    const currentValue = h.shares * currentPrice;
    return { ...h, currentPrice, avgPrice, change, changePct, currentValue, prop };
  });

  const totalCurrentValue = holdingsWithDetail.reduce((s, h) => s + h.currentValue, 0);
  const totalGain = totalCurrentValue - portfolioTotals.invested;
  const totalGainPct = portfolioTotals.invested > 0 ? ((totalGain / portfolioTotals.invested) * 100).toFixed(1) : 0;

  const trends = properties
    .map((p) => {
      const demand = p.totalShares > 0 ? (p.soldShares / p.totalShares) * 100 : 0;
      return { ...p, demand };
    })
    .sort((a, b) => b.demand - a.demand);

  return (
    <>
      <div className="hero">
        <h1 className="heroTitle">Investor Profile</h1>
        <p className="heroSub">Your portfolio overview, analytics, and market trends at a glance.</p>
      </div>

      <div className="heroStats">
        <Stat label="Wallet balance" value={money(wallet)} />
        <Stat label="Portfolio value" value={money(totalCurrentValue)} />
        <Stat label="Total invested" value={money(portfolioTotals.invested)} />
        <Stat label="Total return" value={`${totalGain >= 0 ? "+" : ""}${money(totalGain)}`} />
        <Stat label="Return %" value={`${totalGainPct >= 0 ? "+" : ""}${totalGainPct}%`} />
        <Stat label="Properties held" value={portfolioTotals.count} />
      </div>

      <div className="profileGrid">
        <div className="profileCard">
          <h2 className="sectionHeading">Holdings &amp; Performance</h2>
          {holdingsWithDetail.length === 0 ? (
            <div className="empty">
              <div className="emptyTitle">No holdings yet</div>
              <div className="emptySub">Start investing to see your portfolio performance here.</div>
              <Link className="primaryBtn" to="/">Discover properties</Link>
            </div>
          ) : (
            <div className="ledgerList">
              {holdingsWithDetail.map((h) => (
                <Link key={h.propertyId} to={`/property/${h.propertyId}`} className="ledgerRow" style={{ textDecoration: "none", color: "inherit" }}>
                  <div>
                    <div className="cardName">{h.name}</div>
                    <div className="cardMeta">{h.shares} shares</div>
                  </div>
                  <div className="ledgerNums">
                    <div className="statValue">{money(h.currentValue)}</div>
                    <div className={`trendBadge ${h.changePct >= 0 ? "trendUp" : "trendDown"}`}>
                      {h.changePct >= 0 ? "▲" : "▼"} {Math.abs(h.changePct)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="profileCard">
          <h2 className="sectionHeading">Asset Allocation</h2>
          {holdingsWithDetail.length === 0 ? (
            <div className="empty">
              <div className="emptyTitle">No data</div>
              <div className="emptySub">Your portfolio allocation will appear here once you hold shares.</div>
            </div>
          ) : (
            <div className="allocList">
              {holdingsWithDetail.map((h) => {
                const pct = totalCurrentValue > 0 ? ((h.currentValue / totalCurrentValue) * 100).toFixed(1) : 0;
                return (
                  <div key={h.propertyId} className="allocRow">
                    <div className="allocLabel">
                      <span className="allocName">{h.name}</span>
                      <span className="allocPct">{pct}%</span>
                    </div>
                    <div className="allocBarTrack">
                      <div className="allocBarFill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="allocTotal">
                <span>Total</span>
                <span className="statValue">{money(totalCurrentValue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="profileCard" style={{ marginTop: 24 }}>
        <h2 className="sectionHeading">Market Trends</h2>
        <p className="heroSub">Properties ranked by investor demand (shares sold). Higher demand typically indicates price appreciation pressure.</p>
        <div className="ledgerList">
          {trends.map((p) => (
            <Link key={p.id} to={`/property/${p.id}`} className="ledgerRow" style={{ textDecoration: "none", color: "inherit" }}>
              <div>
                <div className="cardName">{p.name}</div>
                <div className="cardMeta">{p.city} · {p.type} · {p.yieldPct}% yield</div>
              </div>
              <div className="ledgerNums">
                <div className={`trendBadge ${p.demand >= 50 ? "trendUp" : p.demand >= 25 ? "trendNeutral" : "trendDown"}`}>
                  {p.demand >= 50 ? "▲ Hot" : p.demand >= 25 ? "◆ Stable" : "▼ Cold"}
                </div>
                <div className="cardMeta">{p.soldShares}/{p.totalShares} shares sold</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
