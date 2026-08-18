"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity, LayoutDashboard, TrendingDown, TrendingUp } from "lucide-react";
import { api, API_BASE, getToken } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import Stat from "@/components/Stat";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { money } from "@/lib/format";
import type { Holding, Property, User } from "@/lib/types";

interface HoldingDetail extends Holding {
  currentPrice: number;
  avgPrice: number;
  change: number;
  changePct: number;
  currentValue: number;
  prop?: Property;
}

function HoldingsCard({
  holdingsWithDetail,
  totalCurrentValue,
}: {
  holdingsWithDetail: HoldingDetail[];
  totalCurrentValue: number;
}) {
  if (holdingsWithDetail.length === 0) {
    return (
      <div className="card">
        <EmptyState icon={<LayoutDashboard size={22} />} title="No holdings yet" sub="Start investing to see your portfolio performance here.">
          <Link href="/discover" className="btn btnPrimary">
            Discover properties
          </Link>
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="tableWrap">
      <div className="tableScroll">
        <table className="dataTable">
          <thead>
            <tr>
              <th>Property</th>
              <th>Shares</th>
              <th>Invested</th>
              <th>Current value</th>
              <th>Return</th>
            </tr>
          </thead>
          <tbody>
            {holdingsWithDetail.map((h) => (
              <tr key={h.propertyId}>
                <td>
                  <Link href={`/property/${h.propertyId}`} className="dTableLink">
                    {h.name}
                  </Link>
                </td>
                <td>{h.shares}</td>
                <td className="dMuted">{money(h.invested)}</td>
                <td className="dStrong">{money(h.currentValue)}</td>
                <td>
                  <span className={`dReturn ${h.changePct >= 0 ? "dReturnUp" : "dReturnDown"}`}>
                    {h.changePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{" "}
                    {Math.abs(h.changePct)}%
                  </span>
                </td>
              </tr>
            ))}
            <tr>
              <td className="dStrong">Total</td>
              <td />
              <td className="dMuted">
                {money(holdingsWithDetail.reduce((s, h) => s + h.invested, 0))}
              </td>
              <td className="dStrong">{money(totalCurrentValue)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllocationCard({
  holdingsWithDetail,
  totalCurrentValue,
}: {
  holdingsWithDetail: HoldingDetail[];
  totalCurrentValue: number;
}) {
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

function AccountSettings({ user }: { user: User | null }) {
  const { notify, refreshUser } = useApp();
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState<"profile" | "pw" | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("profile");
    setMsg(null);
    try {
      const { user: updated } = await api<{ user: User }>("/users/me", { method: "PUT", body: profile });
      setProfile({ name: updated.name, email: updated.email });
      // Refresh context so the name/avatar everywhere (sidebar, topbar) updates.
      await refreshUser();
      setMsg({ tone: "success", text: "Profile updated." });
      notify("Profile updated.", "success");
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
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
      setMsg({ tone: "error", text: (err as Error).message });
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
            <input
              className="input"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <label className="field">
            <span className="fieldLabel">Email</span>
            <input
              className="input"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
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
            <input
              className="input"
              type="password"
              value={pw.currentPassword}
              onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
            />
          </label>
          <label className="field">
            <span className="fieldLabel">New password</span>
            <input
              className="input"
              type="password"
              value={pw.newPassword}
              onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
            />
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
  const { user, properties, holdings, portfolioTotals, logout, refreshUser } = useApp();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const uploadAvatar = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarMsg({ tone: "error", text: "Please choose an image file (JPG, PNG, WebP or GIF)." });
      return;
    }
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_BASE}/api/users/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken() || ""}` },
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && typeof data === "object" && "error" in data ? String((data as { error: unknown }).error) : null) ||
            `Upload failed (${res.status}).`
        );
      }
      await refreshUser();
      setAvatarMsg({ tone: "success", text: "Profile photo updated." });
    } catch (err) {
      setAvatarMsg({ tone: "error", text: (err as Error).message });
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      await api<{ user: User }>("/users/me", { method: "PUT", body: { avatar: null } });
      await refreshUser();
      setAvatarMsg({ tone: "success", text: "Profile photo removed." });
    } catch (err) {
      setAvatarMsg({ tone: "error", text: (err as Error).message });
    } finally {
      setAvatarBusy(false);
    }
  };

  const propertyMap = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p])),
    [properties]
  );

  const holdingsWithDetail = useMemo<HoldingDetail[]>(
    () =>
      holdings.map((h) => {
        const prop = propertyMap[h.propertyId];
        const currentPrice = prop ? prop.pricePerShare : h.invested / h.shares;
        const avgPrice = h.invested / h.shares;
        const change = currentPrice - avgPrice;
        const changePct = avgPrice > 0 ? Number(((change / avgPrice) * 100).toFixed(1)) : 0;
        const currentValue = h.shares * currentPrice;
        return { ...h, currentPrice, avgPrice, change, changePct, currentValue, prop };
      }),
    [holdings, propertyMap]
  );

  const totalCurrentValue = useMemo(
    () => holdingsWithDetail.reduce((s, h) => s + h.currentValue, 0),
    [holdingsWithDetail]
  );
  const totalGain = totalCurrentValue - portfolioTotals.invested;
  const totalGainPct =
    portfolioTotals.invested > 0
      ? Number(((totalGain / portfolioTotals.invested) * 100).toFixed(1))
      : 0;

  const trends = useMemo(
    () =>
      properties
        .map((p) => ({
          ...p,
          demand: p.totalShares > 0 ? (p.soldShares / p.totalShares) * 100 : 0,
        }))
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
        <button className="btn btnGhost" onClick={logout}>
          Sign out
        </button>
      </div>

      <div className="kpiGrid">
        <Stat label="Portfolio value" value={money(totalCurrentValue)} />
        <Stat label="Total invested" value={money(portfolioTotals.invested)} />
        <Stat
          label="Total return"
          value={`${totalGain >= 0 ? "+" : ""}${money(totalGain)}`}
          tone={totalGain >= 0 ? "up" : "down"}
        />
        <Stat
          label="Return"
          value={`${totalGainPct >= 0 ? "+" : ""}${totalGainPct}%`}
          tone={totalGainPct >= 0 ? "up" : "down"}
        />
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
              <tr>
                <th>Property</th>
                <th>City</th>
                <th>Type</th>
                <th>Yield</th>
                <th>Demand</th>
                <th>Shares sold</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/property/${p.id}`} className="dTableLink">
                      {p.name}
                    </Link>
                  </td>
                  <td className="dMuted">{p.city}</td>
                  <td>{p.type}</td>
                  <td className="dStrong">{p.yieldPct}%</td>
                  <td>
                    <span
                      className={`dReturn ${p.demand >= 50 ? "dReturnUp" : p.demand >= 25 ? "" : "dReturnDown"}`}
                    >
                      {p.demand >= 50 ? (
                        <>
                          <TrendingUp size={12} /> Hot
                        </>
                      ) : p.demand >= 25 ? (
                        <>
                          <Activity size={12} /> Stable
                        </>
                      ) : (
                        <>
                          <TrendingDown size={12} /> Cold
                        </>
                      )}
                    </span>
                  </td>
                  <td className="dMuted">
                    {p.soldShares}/{p.totalShares}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sectionHeading">Account settings</div>
      <div className="dProfileCard">
        <div className="dProfileAvatar">
          <Avatar name={user?.name} src={user?.avatar} size="lg" />
          <div className="dAvatarActions">
            <button
              className="btn btnSoft btnSm"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
            >
              {user?.avatar ? "Replace photo" : "Add photo"}
            </button>
            {user?.avatar && (
              <button className="btn btnGhost btnSm" onClick={removeAvatar} disabled={avatarBusy}>
                Remove
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => uploadAvatar(e.target.files?.[0] || null)}
            />
            {avatarMsg && (
              <div className={avatarMsg.tone === "success" ? "successText" : "errorText"}>
                {avatarMsg.text}
              </div>
            )}
          </div>
        </div>
        <AccountSettings user={user} />
      </div>
    </div>
  );
}
