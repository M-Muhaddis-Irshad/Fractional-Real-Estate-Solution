import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { useApp } from "../../context/AppContext";
import { AreaTrend, BarTrend } from "../../components/Charts";
import Avatar from "../../components/Avatar";
import { money } from "../../lib/format";

export default function AdminFinancials() {
  const { transactions, settings, financials } = useAdmin();
  const { notify } = useApp();
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount] = useState("");

  const series = financials.series;
  const totals = financials;

  const withdrawn = withdrawals.reduce((s, w) => s + w.amount, 0);
  const available = Math.max(0, Math.round(totals.platformEarnings) - withdrawn);

  const requestPayout = (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) {
      notify("Enter a valid payout amount.", "error");
      return;
    }
    if (val > available) {
      notify("Amount exceeds available balance.", "error");
      return;
    }
    setWithdrawals((prev) => [
      { id: `wd_${Date.now()}`, amount: val, status: "pending", date: new Date().toISOString() },
      ...prev,
    ]);
    setAmount("");
    notify(`Payout of ${money(val)} requested — awaiting processing.`, "success");
  };

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Analytics</div>
          <h1 className="pageTitle">Financial dashboard</h1>
          <p className="pageSub">Revenue analytics, investment trends and platform earnings.</p>
        </div>
      </div>

      <div className="kpiGrid">
        <div className="kpi" style={{ borderTop: "3px solid #6366f1" }}>
          <div className="kpiLabel">Total invested</div>
          <div className="kpiValue">{money(totals.totalInvested)}</div>
          <div className="kpiSub">All-time capital deployed</div>
        </div>
        <div className="kpi" style={{ borderTop: "3px solid #10b981" }}>
          <div className="kpiLabel">Platform earnings</div>
          <div className="kpiValue">{money(totals.platformEarnings)}</div>
          <div className="kpiSub">Accrued team fees</div>
        </div>
        <div className="kpi" style={{ borderTop: "3px solid #f59e0b" }}>
          <div className="kpiLabel">Total revenue</div>
          <div className="kpiValue">{money(totals.totalRevenue)}</div>
          <div className="kpiSub">Invested + fees</div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Avg. ticket</div>
          <div className="kpiValue">{money(totals.avgTicket)}</div>
          <div className="kpiSub">Across {totals.investments} investments</div>
        </div>
      </div>

      <div className="grid2">
        <div className="card cardPad">
          <div className="dChartHead">
            <div>
              <div className="cardTitle">Investment trend</div>
              <div className="cardSub">Capital deployed per month</div>
            </div>
          </div>
          {series.length >= 2 ? <AreaTrend data={series} dataKey="invested" height={250} /> : <div className="dChartEmpty">Not enough data yet.</div>}
        </div>
        <div className="card cardPad">
          <div className="dChartHead">
            <div>
              <div className="cardTitle">Commission earned</div>
              <div className="cardSub">Platform fees per month · {settings.teamFee}% rate</div>
            </div>
          </div>
          {series.length >= 1 ? <BarTrend data={series} dataKey="fees" color="var(--success)" height={250} /> : <div className="dChartEmpty">Not enough data yet.</div>}
        </div>
      </div>

      <div className="sectionHeading">Withdrawals</div>
      <div className="grid-2-1">
        <div className="card cardPad">
          <div className="dChartHead">
            <div>
              <div className="cardTitle">Platform balance</div>
              <div className="cardSub">Earned fees available to withdraw</div>
            </div>
          </div>
          <div className="aPayoutSummary">
            <div>
              <div className="kpiLabel">Available balance</div>
              <div className="kpiValue" style={{ color: "var(--success)" }}>{money(available)}</div>
            </div>
            <div>
              <div className="kpiLabel">Pending payouts</div>
              <div className="kpiValue">{withdrawals.length}</div>
            </div>
            <div>
              <div className="kpiLabel">Fee rate</div>
              <div className="kpiValue">{settings.teamFee}%</div>
            </div>
          </div>
        </div>
        <form className="card cardPad" onSubmit={requestPayout}>
          <div className="cardTitle">Request payout</div>
          <div className="cardSub">Withdraw accrued platform earnings (demo — no real transfer).</div>
          <div className="dFormStack">
            <label className="field">
              <span className="fieldLabel">Amount (PKR)</span>
              <input className="input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 250000" />
            </label>
            <button className="btn btnPrimary" disabled={available <= 0}>Request payout</button>
          </div>
        </form>
      </div>

      {withdrawals.length > 0 && (
        <div className="tableWrap" style={{ marginTop: 18 }}>
          <div className="tableScroll">
            <table className="dataTable">
              <thead><tr><th>Amount</th><th>Requested</th><th>Status</th></tr></thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="dStrong">{money(w.amount)}</td>
                    <td className="dMuted">{new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td><span className="badge badgeWarn">Pending</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="sectionHeading">Commission tracking</div>
      <div className="tableWrap">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr><th>Month</th><th>Invested</th><th>Commission</th><th>Effective rate</th></tr>
            </thead>
            <tbody>
              {[...series].reverse().map((m) => (
                <tr key={m.month}>
                  <td className="dStrong">{m.month}</td>
                  <td>{money(m.invested)}</td>
                  <td className="dStrong">{money(m.fees)}</td>
                  <td className="dMuted">{m.invested ? ((m.fees / m.invested) * 100).toFixed(2) : "0.00"}%</td>
                </tr>
              ))}
              {series.length === 0 && <tr><td colSpan={4} className="tableEmpty">No data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sectionHeading">Recent transactions</div>
      <div className="tableWrap">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr><th>Investor</th><th>Property</th><th>Amount</th><th>Fee</th><th>Date</th></tr>
            </thead>
            <tbody>
              {transactions.slice(0, 8).map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="aPropCell">
                      <Avatar name={t.user?.name} size="sm" />
                      <span className="dStrong">{t.user?.name || "—"}</span>
                    </div>
                  </td>
                  <td>{t.propertyName}</td>
                  <td className="dStrong">{money(t.total)}</td>
                  <td className="dMuted">{money(t.teamFee)}</td>
                  <td className="dMuted">{t.date}</td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={5} className="tableEmpty">No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
