import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import Badge from "../../components/Badge";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import { fmtDateTime } from "../../lib/format";

const TABS = [
  { key: "login", label: "Login history" },
  { key: "activity", label: "Admin activity" },
  { key: "audit", label: "Audit trail" },
  { key: "errors", label: "Error logs" },
];

function LogsPanel({ tab }) {
  const [logs, setLogs] = useState(null);
  const [errors, setErrors] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (tab === "errors") {
          const res = await api("/admin/errors");
          if (active) setErrors(res.errors || []);
        } else if (tab === "login") {
          const [res, res2] = await Promise.all([
            api("/admin/logs?type=login"),
            api("/admin/logs?type=admin_login"),
          ]);
          if (active) setLogs([...(res.logs || []), ...(res2.logs || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } else if (tab === "activity") {
          const res = await api("/admin/logs?actor=admin");
          if (active) setLogs(res.logs || []);
        } else {
          const res = await api("/admin/logs");
          if (active) setLogs(res.logs || []);
        }
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [tab]);

  const loading = tab === "errors" ? errors === null : logs === null;

  if (loading) {
    return (
      <div className="card dCardBodyEmpty">
        <div className="spinner spinnerSm" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="card">
        <EmptyState icon="!" title="Couldn't load logs" sub="The log service may be unavailable. Try again shortly." />
      </div>
    );
  }

  if (tab === "errors") {
    return (
      <div className="tableWrap">
        <div className="tableScroll">
          <table className="dataTable">
            <thead><tr><th>Message</th><th>Path</th><th>Type</th><th>Time</th></tr></thead>
            <tbody>
              {errors.length === 0 && <tr><td colSpan={4} className="tableEmpty">No captured errors — the platform is healthy.</td></tr>}
              {errors.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="dStrong" style={{ color: "var(--danger)" }}>{e.message}</div>
                    <div className="dMuted">{e.stack?.split("\n")[1]?.trim() || ""}</div>
                  </td>
                  <td className="dMuted">{e.method} {e.path}</td>
                  <td><Badge status="rejected" label={e.type} /></td>
                  <td className="dMuted">{fmtDateTime(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="tableWrap">
      <div className="tableScroll">
        <table className="dataTable">
          <thead><tr><th>Event</th><th>User</th><th>Actor</th><th>Type</th><th>Time</th></tr></thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={5} className="tableEmpty"><EmptyState icon="≡" title="No log entries yet" /></td></tr>
            )}
            {logs.slice(0, 150).map((l) => (
              <tr key={l.id}>
                <td>
                  <div className="dStrong">{l.message}</div>
                  {l.meta && Object.keys(l.meta).length > 0 && (
                    <div className="dMuted">{JSON.stringify(l.meta)}</div>
                  )}
                </td>
                <td>
                  <div className="aPropCell">
                    <Avatar name={l.user?.name} size="sm" />
                    <span>{l.user?.name || "—"}</span>
                  </div>
                </td>
                <td>{l.actor ? <span className="badge badgeBrand">{l.actor.name}</span> : <span className="dMuted">—</span>}</td>
                <td><span className="badge badgeNeutral">{l.type}</span></td>
                <td className="dMuted">{fmtDateTime(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminLogs() {
  const [tab, setTab] = useState("login");
  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Platform</div>
          <h1 className="pageTitle">Logs</h1>
          <p className="pageSub">Login history, admin activity, audit trail and captured errors.</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} className={"tab" + (tab === t.key ? " tabActive" : "")} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <LogsPanel key={tab} tab={tab} />
    </div>
  );
}
