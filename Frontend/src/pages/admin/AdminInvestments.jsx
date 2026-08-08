import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import Badge from "../../components/Badge";
import Avatar from "../../components/Avatar";
import { money, moneyShort, fmtDateTime } from "../../lib/format";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function AdminInvestments() {
  const { requests, transactions, settings, approveRequest, rejectRequest } = useAdmin();
  const [tab, setTab] = useState("pending");

  const pending = requests.filter((r) => r.status === "pending");
  const rejected = requests.filter((r) => r.status === "rejected");

  const totalInvested = transactions.reduce((s, t) => s + t.total, 0);
  const totalFees = transactions.reduce((s, t) => s + (t.teamFee || 0), 0);

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Management</div>
          <h1 className="pageTitle">Investments</h1>
          <p className="pageSub">Approve purchases, review completed deals and track earnings.</p>
        </div>
      </div>

      <div className="kpiGrid">
        <div className="kpi"><div className="kpiLabel">Total invested</div><div className="kpiValue">{money(totalInvested)}</div></div>
        <div className="kpi"><div className="kpiLabel">Completed deals</div><div className="kpiValue">{transactions.length}</div></div>
        <div className="kpi"><div className="kpiLabel">Platform fees</div><div className="kpiValue">{moneyShort(totalFees)}</div></div>
        <div className="kpi"><div className="kpiLabel">Fee rate</div><div className="kpiValue">{settings.teamFee}%</div></div>
      </div>

      <div className="tabs" style={{ marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.key} className={"tab" + (tab === t.key ? " tabActive" : "")} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === "pending" && pending.length > 0 ? ` (${pending.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <div className="tableWrap">
          <div className="tableScroll">
            <table className="dataTable">
              <thead>
                <tr><th>Investor</th><th>Property</th><th>Shares</th><th>Total cost</th><th>Fee</th><th>Submitted</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pending.length === 0 && (
                  <tr><td colSpan={7} className="tableEmpty">No pending requests — investments settle instantly.</td></tr>
                )}
                {pending.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="aPropCell">
                        <Avatar name={r.user?.name} size="sm" />
                        <div>
                          <div className="dStrong">{r.user?.name || "—"}</div>
                          <div className="dMuted">{r.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="dStrong">{r.propertyName}</td>
                    <td>{r.shares}</td>
                    <td className="dStrong">{money(r.totalCost)}</td>
                    <td className="dMuted">{money(r.teamFeeAmount)} ({r.teamFeePct}%)</td>
                    <td className="dMuted">{fmtDateTime(r.createdAt)}</td>
                    <td>
                      <div className="aRowActions">
                        <button className="btn btnSuccess btnSm" onClick={() => approveRequest(r.id)}>Approve</button>
                        <button className="btn btnDanger btnSm" onClick={() => rejectRequest(r.id)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "completed" && (
        <div className="tableWrap">
          <div className="tableScroll">
            <table className="dataTable">
              <thead>
                <tr><th>Investor</th><th>Property</th><th>Shares</th><th>Total</th><th>Fee earned</th><th>Date</th></tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="tableEmpty">No completed investments yet.</td></tr>
                )}
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="aPropCell">
                        <Avatar name={t.user?.name} size="sm" />
                        <div>
                          <div className="dStrong">{t.user?.name || "—"}</div>
                          <div className="dMuted">{t.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="dStrong">{t.propertyName}</td>
                    <td>{t.shares}</td>
                    <td className="dStrong">{money(t.total)}</td>
                    <td className="dMuted">{money(t.teamFee)}</td>
                    <td className="dMuted">{t.date} · {t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "cancelled" && (
        <div className="tableWrap">
          <div className="tableScroll">
            <table className="dataTable">
              <thead>
                <tr><th>Investor</th><th>Property</th><th>Shares</th><th>Total cost</th><th>Submitted</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rejected.length === 0 && (
                  <tr><td colSpan={6} className="tableEmpty">No cancelled transactions.</td></tr>
                )}
                {rejected.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="aPropCell">
                        <Avatar name={r.user?.name} size="sm" />
                        <div>
                          <div className="dStrong">{r.user?.name || "—"}</div>
                          <div className="dMuted">{r.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="dStrong">{r.propertyName}</td>
                    <td>{r.shares}</td>
                    <td>{money(r.totalCost)}</td>
                    <td className="dMuted">{fmtDateTime(r.createdAt)}</td>
                    <td><Badge status="rejected" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
