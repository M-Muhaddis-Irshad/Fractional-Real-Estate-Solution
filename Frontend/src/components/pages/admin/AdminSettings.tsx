"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import type { AdminSettingsState, PlatformSettings, User } from "@/lib/types";

const TABS = [
  { key: "general", label: "General" },
  { key: "payments", label: "Payments" },
  { key: "security", label: "Security" },
  { key: "profile", label: "Admin profile" },
  { key: "roles", label: "Roles & permissions" },
];

type TabKey = (typeof TABS)[number]["key"];

interface SettingsForm {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  tagline: string;
  minInvestment: string;
  sessionTimeout: string;
  passwordMinLength: string;
  allowRegistration: boolean;
  requireApproval: boolean;
  teamFee?: string;
  termsVersion?: string;
}

function buildForm(platform: PlatformSettings): SettingsForm {
  return {
    platformName: platform.platformName || "Flux",
    supportEmail: platform.supportEmail || "support@flux.app",
    supportPhone: platform.supportPhone || "",
    supportHours: platform.supportHours || "",
    tagline: platform.tagline || "",
    minInvestment: platform.minInvestment || "1000",
    sessionTimeout: platform.sessionTimeout || "30",
    passwordMinLength: platform.passwordMinLength || "6",
    allowRegistration: platform.allowRegistration !== false,
    requireApproval: platform.requireApproval === true,
  };
}

function SettingsBody({
  platform,
  settings,
  users,
}: {
  platform: PlatformSettings;
  settings: AdminSettingsState;
  users: User[];
}) {
  const { savePlatform, saveSettings } = useAdmin();
  const { user, notify } = useApp();
  const [tab, setTab] = useState<TabKey>("general");
  const [form, setForm] = useState<SettingsForm>(() => buildForm(platform));
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof SettingsForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await savePlatform({
      platformName: form.platformName,
      supportEmail: form.supportEmail,
      supportPhone: form.supportPhone,
      supportHours: form.supportHours,
      tagline: form.tagline,
      minInvestment: form.minInvestment,
      sessionTimeout: form.sessionTimeout,
      passwordMinLength: form.passwordMinLength,
      allowRegistration: form.allowRegistration,
      requireApproval: form.requireApproval,
    });
    setSaving(false);
  };

  const handlePayments = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveSettings({ teamFee: Number(form.teamFee), termsVersion: form.termsVersion });
    setSaving(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword.length < 6) {
      notify("New password must be at least 6 characters.", "error");
      return;
    }
    try {
      await api("/auth/password", { method: "PUT", body: pw });
      setPw({ currentPassword: "", newPassword: "" });
      notify("Password changed.", "success");
    } catch (err) {
      notify((err as Error).message, "error");
    }
  };

  const admins = users.filter((u) => u.role === "superadmin");

  return (
    <>
      <div className="tabs" style={{ marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={"tab" + (tab === t.key ? " tabActive" : "")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <form className="card cardPad aFormGrid" onSubmit={handleGeneral}>
          <label className="field">
            <span className="fieldLabel">Platform name</span>
            <input className="input" value={form.platformName} onChange={set("platformName")} />
          </label>
          <label className="field">
            <span className="fieldLabel">Support email</span>
            <input className="input" type="email" value={form.supportEmail} onChange={set("supportEmail")} />
          </label>
          <label className="field">
            <span className="fieldLabel">Support phone</span>
            <input className="input" value={form.supportPhone} onChange={set("supportPhone")} placeholder="e.g. +1 (800) 555-0132" />
          </label>
          <label className="field fieldFull">
            <span className="fieldLabel">Support hours</span>
            <input className="input" value={form.supportHours} onChange={set("supportHours")} placeholder="e.g. Mon–Fri, 9am–6pm PKT" />
          </label>
          <label className="field fieldFull">
            <span className="fieldLabel">Tagline</span>
            <input
              className="input"
              value={form.tagline}
              onChange={set("tagline")}
              placeholder="Short description shown across the product"
            />
          </label>
          <label className="field">
            <span className="fieldLabel">Minimum investment (PKR)</span>
            <input className="input" type="number" value={form.minInvestment} onChange={set("minInvestment")} />
          </label>
          <label className="field">
            <span className="fieldLabel">Session timeout (minutes)</span>
            <input className="input" type="number" value={form.sessionTimeout} onChange={set("sessionTimeout")} />
          </label>
          <label className="aCheckField">
            <input type="checkbox" checked={form.allowRegistration} onChange={set("allowRegistration")} />
            <div>
              <div className="fieldLabel">Open registration</div>
              <div className="fieldHint">Allow new investors to create accounts.</div>
            </div>
          </label>
          <label className="aCheckField">
            <input type="checkbox" checked={form.requireApproval} onChange={set("requireApproval")} />
            <div>
              <div className="fieldLabel">Require admin approval</div>
              <div className="fieldHint">
                When off (default), new accounts get instant access and purchases complete automatically.
              </div>
            </div>
          </label>
          <div className="aFormActions fieldFull">
            <button className="btn btnPrimary" disabled={saving}>
              {saving ? "Saving…" : "Save general settings"}
            </button>
          </div>
        </form>
      )}

      {tab === "payments" && (
        <form className="card cardPad aFormGrid" onSubmit={handlePayments}>
          <label className="field">
            <span className="fieldLabel">Team fee (%)</span>
            <input
              className="input"
              type="number"
              step="0.05"
              min="0"
              max="25"
              value={form.teamFee ?? settings.teamFee}
              onChange={(e) => setForm((f) => ({ ...f, teamFee: e.target.value }))}
            />
            <span className="fieldHint">Commission charged on every approved investment. Current: {settings.teamFee}%</span>
          </label>
          <label className="field">
            <span className="fieldLabel">Terms version</span>
            <input
              className="input"
              value={form.termsVersion ?? settings.termsVersion ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, termsVersion: e.target.value }))}
            />
            <span className="fieldHint">Bumped when you update the terms; users are asked to re-accept.</span>
          </label>
          <label className="field fieldFull">
            <span className="fieldLabel">Accrued platform earnings</span>
            <input className="input" value={settings.teamEarnings} disabled />
            <span className="fieldHint">Total team fees earned from completed investments.</span>
          </label>
          <div className="aFormActions fieldFull">
            <button className="btn btnPrimary" disabled={saving}>
              {saving ? "Saving…" : "Save payment settings"}
            </button>
          </div>
        </form>
      )}

      {tab === "security" && (
        <form
          className="card cardPad aFormGrid"
          onSubmit={(e) => {
            e.preventDefault();
            notify("Security settings saved.", "success");
          }}
        >
          <label className="field">
            <span className="fieldLabel">Minimum password length</span>
            <input
              className="input"
              type="number"
              min="6"
              value={form.passwordMinLength}
              onChange={set("passwordMinLength")}
            />
          </label>
          <label className="aCheckField">
            <input type="checkbox" defaultChecked />
            <div>
              <div className="fieldLabel">Two-factor authentication</div>
              <div className="fieldHint">Require 2FA for admin accounts (requires email provider).</div>
            </div>
          </label>
          <label className="aCheckField">
            <input type="checkbox" defaultChecked />
            <div>
              <div className="fieldLabel">Login alerts</div>
              <div className="fieldHint">Log every sign-in for the audit trail.</div>
            </div>
          </label>
          <div className="aFormActions fieldFull">
            <button className="btn btnPrimary">Save security settings</button>
          </div>
        </form>
      )}

      {tab === "profile" && (
        <div className="grid2">
          <form
            className="card cardPad"
            onSubmit={(e) => {
              e.preventDefault();
              notify("Profile saved.", "success");
            }}
          >
            <div className="dFormStack">
              <div className="dProfileAvatar">
                <Avatar name={user?.name} src={user?.avatar} size="lg" />
              </div>
              <label className="field">
                <span className="fieldLabel">Name</span>
                <input className="input" defaultValue={user?.name} />
              </label>
              <label className="field">
                <span className="fieldLabel">Email</span>
                <input className="input" defaultValue={user?.email} disabled />
              </label>
              <button className="btn btnPrimary">Save profile</button>
            </div>
          </form>
          <form className="card cardPad" onSubmit={changePassword}>
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
              <button className="btn btnGhost">Change password</button>
            </div>
          </form>
        </div>
      )}

      {tab === "roles" && (
        <div className="tableWrap">
          <div className="tableScroll">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Email</th>
                  <th>Permissions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="aPropCell">
                        <Avatar name={a.name} size="sm" />
                        <span className="dStrong">{a.name}</span>
                      </div>
                    </td>
                    <td className="dMuted">{a.email}</td>
                    <td>
                      <span className="badge badgeBrand">Full access</span>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={3} className="tableEmpty">
                      No admins found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminSettings() {
  const { platform, settings, users } = useAdmin();
  if (!platform || !settings) return null;
  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Platform</div>
          <h1 className="pageTitle">Settings</h1>
          <p className="pageSub">Configure the platform, payments, security and admin roles.</p>
        </div>
      </div>
      <SettingsBody key={JSON.stringify(platform)} platform={platform} settings={settings} users={users} />
    </div>
  );
}
