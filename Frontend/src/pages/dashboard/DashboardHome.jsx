import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Stat from "../../components/Stat";
import { AreaTrend } from "../../components/Charts";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import { money, timeAgo } from "../../lib/format";

export default function DashboardHome() {
  const { user, properties, holdings, transactions, portfolioTotals, portfolioSeries, purchaseRequests, notifications, teamFee } = useApp();

  const { currentValue, totalGain, totalGainPct } = useMemo(() => {
    const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p]));
    let currentValue = 0;
    for (const h of holdings) {
      const prop = propertyMap[h.propertyId];
      if (prop) currentValue += h.shares * prop.pricePerShare;
    }
    const gain = currentValue - portfolioTotals.invested;
    const pct = portfolioTotals.invested > 0 ? ((gain / portfolioTotals.invested) * 100).toFixed(1) : 0;
    return { currentValue, totalGain: gain, totalGainPct: pct };
  }, [holdings, properties, portfolioTotals]);

  const pending = purchaseRequests.filter((r) => r.status === "pending");
  const recentTx = transactions.slice(0, 5);
  const firstTx = transactions.length
    ? [...transactions].sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))[0]
    : null;

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Welcome back</div>
          <h1 className="pageTitle">Good to see you, {user?.name?.split(" ")[0] || "Investor"} 👋</h1>
          <p className="pageSub">
            {transactions.length
              ? `Your portfolio has grown since your first investment${firstTx ? ` on ${firstTx.date}` : ""}.`
              : "Explore assets and build your fractional real-estate portfolio."}
          </p>
        </div>
        <Link to="/discover" className="btn btnPrimary">
          + Explore assets
        </Link>
      </div>

      <div className="kpiGrid">
        <Stat label="Portfolio value" value={money(currentValue)} delta={`${totalGainPct >= 0 ? "▲" : "▼"} ${Math.abs(totalGainPct)}%`} tone={totalGainPct >= 0 ? "up" : "down"} />
        <Stat label="Total invested" value={money(portfolioTotals.invested)} />
        <Stat label="Total return" value={`${totalGain >= 0 ? "+" : ""}${money(totalGain)}`} tone={totalGain >= 0 ? "up" : "down"} />
        <Stat label="Properties held" value={portfolioTotals.count} />
      </div>

      <div className="grid-2-1">
        <div className="card cardPad">
          <div className="dChartHead">
            <div>
              <div className="cardTitle">Portfolio growth</div>
              <div className="cardSub">Cumulative invested capital over time</div>
            </div>
            {teamFee != null && <Badge status="active" label={`Team fee ${teamFee}%`} />}
          </div>
          {portfolioSeries.length >= 2 ? (
            <AreaTrend data={portfolioSeries} dataKey="invested" height={260} />
          ) : (
            <div className="dChartEmpty">Start investing to see your growth curve here.</div>
          )}
        </div>

        <div className="dStack">
          <div className="card">
            <div className="cardHead">
              <div className="cardTitle">Pending approvals</div>
              <Link to="/ledger" className="dLink">View all →</Link>
            </div>
            {pending.length === 0 ? (
              <div className="dCardBodyEmpty">Nothing waiting for approval.</div>
            ) : (
              <div className="dMiniList">
                {pending.slice(0, 4).map((r) => (
                  <div className="dMiniRow" key={r.id}>
                    <div>
                      <div className="dMiniName">{r.propertyName}</div>
                      <div className="dMiniMeta">{r.shares} shares · {r.date}</div>
                    </div>
                    <div className="dMiniRight">
                      <div className="dMiniAmount">{money(r.totalCost)}</div>
                      <Badge status="pending" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="cardHead">
              <div className="cardTitle">Recent announcements</div>
              <Link to="/notifications" className="dLink">View all →</Link>
            </div>
            {notifications.length === 0 ? (
              <div className="dCardBodyEmpty">No announcements yet.</div>
            ) : (
              <div className="dMiniList">
                {notifications.slice(0, 3).map((n) => (
                  <div className="dMiniRow" key={n.id}>
                    <div>
                      <div className="dMiniName">{n.title}</div>
                      <div className="dMiniMeta">{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.read && <span className="dUnreadDot" title="Unread" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sectionHeading">Recent transactions</div>
      <div className="tableWrap">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Property</th>
                <th>Date</th>
                <th>Shares</th>
                <th>Price / share</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.length === 0 && (
                <tr>
                  <td colSpan={6} className="tableEmpty">
                    No transactions yet — <Link to="/discover">discover assets</Link> to get started.
                  </td>
                </tr>
              )}
              {recentTx.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/property/${t.propertyId}`} className="dTableLink">{t.name}</Link>
                  </td>
                  <td className="dMuted">{t.date}</td>
                  <td>{t.shares}</td>
                  <td className="dMuted">{money(t.pricePerShare)}</td>
                  <td className="dStrong">{money(t.total)}</td>
                  <td><Badge status="approved" label="Completed" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sectionHeading">Quick actions</div>
      <div className="grid3">
        {[
          { icon: "◎", title: "Browse marketplace", sub: "Discover vetted properties and request shares.", to: "/discover" },
          { icon: "▤", title: "Review your ledger", sub: "Track holdings, requests and receipts.", to: "/ledger" },
          { icon: "●", title: "Manage profile", sub: "Update your details, password and preferences.", to: "/profile" },
        ].map((a) => (
          <Link to={a.to} className="dQuick" key={a.to}>
            <span className="dQuickIcon">{a.icon}</span>
            <div>
              <div className="dQuickTitle">{a.title}</div>
              <div className="dQuickSub">{a.sub}</div>
            </div>
            <span className="dQuickArrow">→</span>
          </Link>
        ))}
      </div>

      {holdings.length === 0 && <EmptyState icon="◈" title="Your portfolio is empty" sub="Submit a purchase request from the marketplace and start earning." />}
    </div>
  );
}
