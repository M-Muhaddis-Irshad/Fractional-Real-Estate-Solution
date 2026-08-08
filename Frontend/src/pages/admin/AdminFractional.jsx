import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import Badge from "../../components/Badge";
import { api } from "../../lib/api";
import { money, moneyShort, shortHash } from "../../lib/format";

export default function AdminFractional() {
  const { properties, transactions, toggleInvesting } = useAdmin();
  const [tokens, setTokens] = useState([]);
  const [chain, setChain] = useState(null);

  // Refresh the ledger whenever admin data refreshes (incl. realtime events).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [tokRes, chainRes] = await Promise.all([
          api("/admin/tokens"),
          api("/admin/tokens/verify"),
        ]);
        if (!active) return;
        setTokens(tokRes.tokens || []);
        setChain(chainRes);
      } catch {
        /* non-critical */
      }
    })();
    return () => {
      active = false;
    };
  }, [transactions, properties]);

  const totals = useMemo(() => {
    let totalShares = 0;
    let soldShares = 0;
    for (const p of properties) {
      totalShares += p.totalShares || 0;
      soldShares += p.soldShares || 0;
    }
    const investedByProperty = new Map();
    for (const t of transactions) {
      investedByProperty.set(t.propertyId, (investedByProperty.get(t.propertyId) || 0) + t.total);
    }
    return { totalShares, soldShares, investedByProperty };
  }, [properties, transactions]);

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Fractional ownership</div>
          <h1 className="pageTitle">Offerings &amp; shares</h1>
          <p className="pageSub">Configure share supply, monitor funding and pause or resume investments.</p>
        </div>
      </div>

      <div className="kpiGrid">
        <div className="kpi"><div className="kpiLabel">Total shares issued</div><div className="kpiValue">{totals.totalShares}</div></div>
        <div className="kpi"><div className="kpiLabel">Shares sold</div><div className="kpiValue">{totals.soldShares}</div></div>
        <div className="kpi"><div className="kpiLabel">Shares remaining</div><div className="kpiValue">{totals.totalShares - totals.soldShares}</div></div>
        <div className="kpi"><div className="kpiLabel">Avg. funded</div><div className="kpiValue">{totals.totalShares ? Math.round((totals.soldShares / totals.totalShares) * 100) : 0}%</div></div>
      </div>

      <div className="aFracGrid">
        {properties.map((p) => {
          const remaining = p.totalShares - p.soldShares;
          const pct = p.totalShares ? Math.round((p.soldShares / p.totalShares) * 100) : 0;
          const invested = totals.investedByProperty.get(p.id) || 0;
          const paused = p.investingOpen === false;
          return (
            <div className={"card cardPad aFrac" + (paused ? " aFracPaused" : "")} key={p.id}>
              <div className="aFracHead">
                <div>
                  <div className="dStrong">{p.name}</div>
                  <div className="dMuted">{p.city} · {p.type}</div>
                </div>
                <Badge status={p.status} />
              </div>

              <div className="aFracShares">
                <div className="aFracShareBox">
                  <div className="aFracShareVal">{p.totalShares}</div>
                  <div className="aFracShareLabel">Total</div>
                </div>
                <div className="aFracShareBox">
                  <div className="aFracShareVal aFracSold">{p.soldShares}</div>
                  <div className="aFracShareLabel">Sold</div>
                </div>
                <div className="aFracShareBox">
                  <div className="aFracShareVal aFracLeft">{remaining}</div>
                  <div className="aFracShareLabel">Remaining</div>
                </div>
              </div>

              <div className="aFracProgress">
                <div className="progress"><div className="progressFill" style={{ width: `${pct}%` }} /></div>
                <div className="dMuted">{pct}% funded</div>
              </div>

              <div className="aFracRows">
                <div><span>Price per share</span><span className="dStrong">{money(p.pricePerShare)}</span></div>
                <div><span>Total value</span><span>{moneyShort(p.totalValue)}</span></div>
                <div><span>Capital raised</span><span className="dStrong">{money(invested)}</span></div>
                <div><span>Yield</span><span>{p.yieldPct}% APY</span></div>
              </div>

              <div className="aFracActions">
                <label className="switch">
                  <input type="checkbox" checked={!paused} onChange={(e) => toggleInvesting(p.id, e.target.checked)} />
                  <span className="switchTrack" />
                </label>
                <span className="aFracToggleLabel">{paused ? "Investing paused" : "Investing open"}</span>
              </div>
            </div>
          );
        })}
        {properties.length === 0 && (
          <div className="card dCardBodyEmpty">No properties listed yet.</div>
        )}
      </div>

      <div className="sectionHeading">
        Flux Chain ledger <span className="dMuted">— tokenized ownership</span>
        {chain && (
          <span className={`badge ${chain.valid ? "badgeSuccess" : "badgeDanger"}`}>
            {chain.valid ? `✓ ${chain.blockCount} blocks verified` : "✗ chain integrity failed"}
          </span>
        )}
      </div>
      <div className="tableWrap">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr><th>Token</th><th>Owner</th><th>Property</th><th>Shares</th><th>Value</th><th>Block</th><th>Block hash</th></tr>
            </thead>
            <tbody>
              {tokens.filter((t) => t.kind === "mint").map((t) => (
                <tr key={t.id}>
                  <td className="dMono dStrong">{t.tokenId}</td>
                  <td>{t.owner?.name || t.ownerName || "—"}</td>
                  <td className="dStrong">{t.propertyName}</td>
                  <td>{t.shares}</td>
                  <td className="dStrong">{money(t.totalValue)}</td>
                  <td className="dMono">#{t.blockNumber}</td>
                  <td className="dMono">{shortHash(t.hash)}</td>
                </tr>
              ))}
              {tokens.filter((t) => t.kind === "mint").length === 0 && (
                <tr><td colSpan={7} className="tableEmpty">No tokens minted yet — purchases mint automatically.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
