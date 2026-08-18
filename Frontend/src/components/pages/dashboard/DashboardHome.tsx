"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Coins,
  MapPin,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import EmptyState from "@/components/EmptyState";
import { money } from "@/lib/format";

export default function DashboardHome() {
  const { user, properties, holdings, transactions, portfolioTotals, pendingRequests } = useApp();

  const propertyMap = useMemo(() => Object.fromEntries(properties.map((p) => [p.id, p])), [properties]);

  // Current portfolio value + total gain vs. capital invested.
  const { currentValue, totalGain, totalGainPct } = useMemo(() => {
    let currentValue = 0;
    for (const h of holdings) {
      const prop = propertyMap[h.propertyId];
      if (prop) currentValue += h.shares * prop.pricePerShare;
    }
    const gain = currentValue - portfolioTotals.invested;
    const pct =
      portfolioTotals.invested > 0
        ? Number(((gain / portfolioTotals.invested) * 100).toFixed(1))
        : 0;
    return { currentValue, totalGain: gain, totalGainPct: pct };
  }, [holdings, propertyMap, portfolioTotals]);

  // Weighted average of the annual yield of the properties actually held
  // (weighted by capital invested in each).
  const avgYield = useMemo(() => {
    let sum = 0;
    let weight = 0;
    for (const h of holdings) {
      const prop = propertyMap[h.propertyId];
      if (prop) {
        sum += prop.yieldPct * h.invested;
        weight += h.invested;
      }
    }
    return weight > 0 ? sum / weight : 0;
  }, [holdings, propertyMap]);

  // "Recent Activity" has no dedicated per-user feed endpoint yet (only the
  // admin activity log exists), so we surface the user's latest transactions —
  // the closest real source with dates, titles and amounts.
  const recentActivity = useMemo(() => transactions.slice(0, 5), [transactions]);

  const firstName = user?.name?.split(" ")[0] || "Investor";

  return (
    <div className="riseIn dashPage">
      {/* Page heading — large serif title + gray subtitle */}
      <div className="dashHead">
        <div>
          <h1 className="dashTitle">Investor Dashboard</h1>
          <p className="dashSub">
            Welcome back, {firstName}. Here&apos;s an overview of your portfolio.
          </p>
        </div>
      </div>

      {/* 3-column stat row — two light cards + one deep-navy emphasis card */}
      <div className="dashStats">
        <div className="dashStat">
          <div className="dashStatHead">
            <span className="dashStatLabel">Portfolio value</span>
            <span className="dashStatIcon" aria-hidden="true">
              <Wallet size={16} />
            </span>
          </div>
          <div className="dashStatValue">{money(currentValue)}</div>
          <div className="dashStatSub">Total invested {money(portfolioTotals.invested)}</div>
        </div>

        <div className="dashStat dashStatDark">
          <div className="dashStatHead">
            <span className="dashStatLabel">Total returns</span>
            <span className="dashStatIcon" aria-hidden="true">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="dashStatValue">
            {totalGain >= 0 ? "+" : ""}
            {money(totalGain)}
          </div>
          <div className="dashStatTrend">
            <span className={"dashPill" + (totalGainPct >= 0 ? " dashPillUp" : " dashPillDown")}>
              {totalGainPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{" "}
              {Math.abs(totalGainPct)}%
            </span>
            <span className="dashStatSub">since your first investment</span>
          </div>
        </div>

        <div className="dashStat">
          <div className="dashStatHead">
            <span className="dashStatLabel">Avg. yield</span>
            <span className="dashStatIcon" aria-hidden="true">
              <Percent size={16} />
            </span>
          </div>
          <div className="dashStatValue">{avgYield.toFixed(1)}%</div>
          <div className="dashStatSub">
            Across {portfolioTotals.count} propert{portfolioTotals.count === 1 ? "y" : "ies"}
          </div>
        </div>
      </div>

      {/* Main column (owned property shares) + right column (pending + activity) */}
      <div className="dashColumns">
        <section className="dashMainCol">
          <div className="dashSectionHead">
            <h2 className="dashSectionTitle">Owned Property Shares</h2>
            <Link href="/ledger" className="dashViewAll">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {holdings.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<Wallet size={22} />}
                title="Your portfolio is empty"
                sub="Submit a purchase request from the marketplace and start earning."
              >
                <Link href="/discover" className="btn btnGold">
                  Explore assets
                </Link>
              </EmptyState>
            </div>
          ) : (
            <div className="dashProps">
              {holdings.map((h) => {
                const prop = propertyMap[h.propertyId];
                const shareValue = prop ? h.shares * prop.pricePerShare : h.invested;
                const pctFunded = prop && prop.totalShares > 0
                  ? Math.round((prop.soldShares / prop.totalShares) * 100)
                  : 0;
                const thumbStyle = prop?.imageUrl
                  ? { backgroundImage: `url(${prop.imageUrl})` }
                  : {
                      background: `linear-gradient(135deg, hsl(${prop?.hue ?? 220} 45% 30%), hsl(${((prop?.hue ?? 220) + 50) % 360} 45% 18%))`,
                    };
                return (
                  <div className="dashProp" key={h.propertyId}>
                    <Link
                      href={`/property/${h.propertyId}`}
                      className="dashPropMedia"
                      style={thumbStyle}
                      role="img"
                      aria-label={prop ? `${prop.name} in ${prop.city}` : h.name}
                    >
                      {!prop?.imageUrl && <span className="dashPropMediaFallback">{prop?.initials}</span>}
                      <span className="dashPropShade" aria-hidden="true" />
                      <span className="dashPropOverlay">
                        <span className="dashPropName">{h.name}</span>
                        <span className="dashPropLoc">
                        <MapPin size={11} /> {prop?.city ?? ""}
                      </span>
                      </span>
                    </Link>
                    <div className="dashPropBody">
                      <div className="dashPropStats">
                        <div>
                          <div className="dashPropStatLabel">Share value</div>
                          <div className="dashPropStatVal">{money(shareValue)}</div>
                        </div>
                        <div>
                          <div className="dashPropStatLabel">Equity</div>
                          <div className="dashPropStatVal">{money(h.invested)}</div>
                        </div>
                      </div>
                      <div
                        className="dashPropBar"
                        role="progressbar"
                        aria-valuenow={pctFunded}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Asset funding progress"
                      >
                        <div className="dashPropBarFill" style={{ width: `${pctFunded}%` }} />
                      </div>
                      <div className="dashPropFoot">
                        <span className="dashPropYield">
                          <TrendingUp size={12} /> {prop?.yieldPct ?? 0}% APY
                        </span>
                        <Link href={`/property/${h.propertyId}`} className="dashPropDetails">
                          Details <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="dashSideCol">
          {/* Pending requests */}
          <div className="dashCard">
            <div className="dashCardHead">
              <h3 className="dashCardTitle">Pending Requests</h3>
              <Link href="/ledger" className="dashViewAll">
                View all
              </Link>
            </div>
            {pendingRequests.length === 0 ? (
              <div className="dashCardEmpty">All investments settle instantly — nothing awaits approval.</div>
            ) : (
              <div className="dashReqList">
                {pendingRequests.slice(0, 4).map((r) => (
                  <div className="dashReq" key={r.id}>
                    <span className="dashReqIcon" aria-hidden="true">
                      <Clock size={15} />
                    </span>
                    <div className="dashReqBody">
                      <div className="dashReqTitle">{r.propertyName}</div>
                      <div className="dashReqMeta">
                        {r.shares} shares · {money(r.totalCost)}
                      </div>
                      {/* No per-request step/timeline field exists in the data model;
                          the bar reflects the real status: submitted = 1 of 2 steps. */}
                      <div className="dashReqBar">
                        <div className="dashReqBarFill" style={{ width: "35%" }} />
                      </div>
                      <div className="dashReqStep">Step 1 of 2 · Awaiting team review</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="dashCard">
            <div className="dashCardHead">
              <h3 className="dashCardTitle">Recent Activity</h3>
              <Link href="/ledger" className="dashViewAll">
                View all
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <div className="dashCardEmpty">No activity yet — explore assets to get started.</div>
            ) : (
              <div className="dashActList">
                {recentActivity.map((t) => (
                  <div className="dashAct" key={t.id}>
                    <span className="dashActIcon" aria-hidden="true">
                      <Coins size={15} />
                    </span>
                    <div className="dashActBody">
                      <div className="dashActTop">
                        <span className="dashActTitle">{t.name}</span>
                        <span className="dashActDate">{t.date}</span>
                      </div>
                      <div className="dashActSub">
                        {t.shares} shares @ {money(t.pricePerShare)}/share
                      </div>
                      <div className="dashActAmt">+{money(t.total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
