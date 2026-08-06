import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useApp } from "../../context/AppContext";
import Stat from "../../components/Stat";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import { money } from "../../lib/format";

function HoldingsCard({ holdingsWithDetail, totalCurrentValue }) {
  if (holdingsWithDetail.length === 0) {
    return (
      <div className="card">
        <EmptyState icon="◈" title="No holdings yet" sub="Start investing to see your portfolio performance here.">
          <Link to="/discover" className="btn btnPrimary">Discover properties</Link>
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="tableWrap">
      <div className="tableScroll">
        <table className="dataTable">
          <thead>
            <tr><th>Property</th><th>Shares</th><th>Invested</th><th>Current value</th><th>Return</th></tr>
          </thead>
          <tbody>
            {holdingsWithDetail.map((h) => (
              <tr key={h.propertyId}>
                <td><Link to={`/property/${h.propertyId}`} className="dTableLink">{h.name}</Link></td>
                <td>{h.shares}</td>
                <td className="dMuted">{money(h.invested)}</td>
                <td className="dStrong">{money(h.currentValue)}</td>
                <td>
                  <span className={`dReturn ${h.changePct >= 0 ? "dReturnUp" : "dReturnDown"}`}>
                    {h.changePct >= 0 ? "▲" : "▼"} {Math.abs(h.changePct)}%
                  </span>
                </td>
              </tr>
            ))}
            <tr>
              <td className="dStrong">Total</td>
              <td />
              <td className="dMuted">{money(holdingsWithDetail.reduce((s, h) => s + h.invested, 0))}</td>
              <td className="dStrong">{money(totalCurrentValue)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllocationCard({ holdingsWithDetail, totalCurrentValue }) {
  if (holdingsWithDetail.length === 0) {
    return <div className="card cardPad dCardBodyEmpty">Allocation appears here once you hold shares.</div>;
  }
  return (
    <div className="card cardPad">
      {holdingsWithDetail.map((h) => {
        const pct = totalCurrentValue > 0 ? ((h.currentValue / totalCurrentValue) * 100).toFixed(1) : 0;
        return (
          <div className="dAllocRow" key={h.propertyId}>
            <div className="dAllocHead">
              <span className="dAllocName">{h.name}</span>
              <span className="dAllocPct">{pct}%</span>
            </div>
            <div className="progress">
              <div className="progressFill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="dAllocTotal">
        <span>Total</span>
        <span className="dStrong">{money(totalCurrentValue)}</span>
      </div>
    </div>
  );
}

function AccountSettings() {
  const { user, notify } = useApp();
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy("profile");
    setMsg(null);
    try {
      const { user: updated } = await api("/users/me", { method: "PUT", body: profile });
      setProfile({ name: updated.name, email: updated.email });
      setMsg({ tone: "success", text: "Profile updated." });
      notify("Profile updated.", "success");
    } catch (err) {
      setMsg({ tone: "error", text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 6) {
      setMsg({ tone: "error", text: "New password must be at least 6 characters." });
      return;
    }
    setBusy("pw");
    setMsg(null);
    try {
      await api("/auth/password", { method: "PUT", body: pw });
      setPw({ currentPassword: "", newPassword: "" });
      setMsg({ tone: "success", text: "Password changed." });
      notify("Password changed.", "success");
    } catch (err) {
      setMsg({ tone: "error", text: err.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid2">
      <form className="card cardPad" onSubmit={saveProfile}>
        <div className="cardTitle">Profile details</div>
        <div className="cardSub">Update your public profile information.</div>
        <div className="dFormStack">
          <label className="field">
            <span className="fieldLabel">Full name</span>
            <input className="input" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          </label>
          <label className="field">
            <span className="fieldLabel">Email</span>
            <input className="input" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
          </label>
          <button className="btn btnPrimary" disabled={busy === "profile"}>
            {busy === "profile" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <form className="card cardPad" onSubmit={changePassword}>
        <div className="cardTitle">Security</div>
        <div className="cardSub">Change your account password.</div>
        <div className="dFormStack">
          <label className="field">
            <span className="fieldLabel">Current password</span>
            <input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} />
          </label>
          <label className="field">
            <span className="fieldLabel">New password</span>
            <input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} />
          </label>
          <button className="btn btnGhost" disabled={busy === "pw"}>
            {busy === "pw" ? "Changing…" : "Change password"}
          </button>
        </div>
      </form>
      {msg && <div className={msg.tone === "success" ? "successText" : "errorText"}>{msg.text}</div>}
    </div>
  );
}

export default function Profile() {
  const { user, properties, holdings, portfolioTotals, logout } = useApp();

  const propertyMap = useMemo(() => Object.fromEntries(properties.map((p) => [p.id, p])), [properties]);

  const holdingsWithDetail = useMemo(
    () =>
      holdings.map((h) => {
        const prop = propertyMap[h.propertyId];
        const currentPrice = prop ? prop.pricePerShare : h.invested / h.shares;
        const avgPrice = h.invested / h.shares;
        const change = currentPrice - avgPrice;
        const changePct = avgPrice > 0 ? ((change / avgPrice) * 100).toFixed(1) : 0;
        const currentValue = h.shares * currentPrice;
        return { ...h, currentPrice, avgPrice, change, changePct, currentValue, prop };
      }),
    [holdings, propertyMap]
  );

  const totalCurrentValue = useMemo(() => holdingsWithDetail.reduce((s, h) => s + h.currentValue, 0), [holdingsWithDetail]);
  const totalGain = totalCurrentValue - portfolioTotals.invested;
  const totalGainPct = portfolioTotals.invested > 0 ? ((totalGain / portfolioTotals.invested) * 100).toFixed(1) : 0;

  const trends = useMemo(
    () =>
      properties
        .map((p) => ({ ...p, demand: p.totalShares > 0 ? (p.soldShares / p.totalShares) * 100 : 0 }))
        .sort((a, b) => b.demand - a.demand),
    [properties]
  );

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Investor profile</div>
          <h1 className="pageTitle">{user?.name}</h1>
          <p className="pageSub">Portfolio performance, analytics and account settings.</p>
        </div>
        <button className="btn btnGhost" onClick={logout}>Sign out</button>
      </div>

      <div className="kpiGrid">
        <Stat label="Portfolio value" value={money(totalCurrentValue)} />
        <Stat label="Total invested" value={money(portfolioTotals.invested)} />
        <Stat label="Total return" value={`${totalGain >= 0 ? "+" : ""}${money(totalGain)}`} tone={totalGain >= 0 ? "up" : "down"} />
        <Stat label="Return" value={`${totalGainPct >= 0 ? "+" : ""}${totalGainPct}%`} tone={totalGainPct >= 0 ? "up" : "down"} />
      </div>

      <div className="sectionHeading">Holdings &amp; performance</div>
      <HoldingsCard holdingsWithDetail={holdingsWithDetail} totalCurrentValue={totalCurrentValue} />

      <div className="sectionHeading">Asset allocation</div>
      <AllocationCard holdingsWithDetail={holdingsWithDetail} totalCurrentValue={totalCurrentValue} />

      <div className="sectionHeading">Market trends</div>
      <div className="tableWrap">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr><th>Property</th><th>City</th><th>Type</th><th>Yield</th><th>Demand</th><th>Shares sold</th></tr>
            </thead>
            <tbody>
              {trends.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/property/${p.id}`} className="dTableLink">{p.name}</Link></td>
                  <td className="dMuted">{p.city}</td>
                  <td>{p.type}</td>
                  <td className="dStrong">{p.yieldPct}%</td>
                  <td>
                    <span className={`dReturn ${p.demand >= 50 ? "dReturnUp" : p.demand >= 25 ? "" : "dReturnDown"}`}>
                      {p.demand >= 50 ? "▲ Hot" : p.demand >= 25 ? "◆ Stable" : "▼ Cold"}
                    </span>
                  </td>
                  <td className="dMuted">{p.soldShares}/{p.totalShares}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sectionHeading">Account settings</div>
      <div className="dProfileCard">
        <div className="dProfileAvatar">
          <Avatar name={user?.name} size="lg" />
        </div>
        <AccountSettings />
      </div>
    </div>
  );
}
