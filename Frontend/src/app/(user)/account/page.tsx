"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  BarChart3,
  Bell,
  Compass,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";

/**
 * Account hub — mobile-only consolidation screen (≤960px).
 * Lists every section a mobile user currently can't easily reach from the
 * bottom bar alone. On desktop the sidebar already provides direct access.
 * This page has NO desktop styles — .dAccountHub is display:none by default
 * and only enabled inside @media (max-width: 960px) in dashboard.css.
 */

const ROWS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", sub: "Overview & quick actions" },
  { to: "/discover", icon: Compass, label: "Discover assets", sub: "Browse properties" },
  { to: "/ledger", icon: ArrowRightLeft, label: "My Ledger", sub: "Transactions & holdings" },
  { to: "/notifications", icon: Bell, label: "Notifications", sub: "Alerts & updates" },
  { to: "/profile", icon: UserIcon, label: "Profile & Settings", sub: "Edit profile, password, avatar" },
];

export default function AccountPage() {
  const { user, logout, portfolioTotals } = useApp();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <div className="dAccountHub">
      {/* Header card */}
      <div className="dAccountHeader">
        <Avatar name={user?.name} src={user?.avatar} size="lg" />
        <div className="dAccountName">{user?.name}</div>
        <div className="dAccountEmail">{user?.email}</div>
        <div className="dAccountRole">
          <ShieldCheck size={12} />
          {user?.role === "superadmin" ? "Administrator" : "Pro Investor"}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="dAccountList">
        <div className="dAccountRow" style={{ cursor: "default" }}>
          <span className="dAccountRowIcon" style={{ background: "var(--gold-soft)", color: "var(--gold)" }}>
            <BarChart3 size={17} />
          </span>
          <span className="dAccountRowLabel">Portfolio value</span>
          <span className="dAccountRowMeta" style={{ fontWeight: 700, color: "var(--ink)" }}>
            {portfolioTotals.shares > 0 ? `${portfolioTotals.shares} shares` : "No holdings"}
          </span>
        </div>
      </div>

      {/* Navigation rows */}
      <div className="dAccountList">
        {ROWS.map((r) => (
          <a key={r.to} href={r.to} className="dAccountRow">
            <span className="dAccountRowIcon">
              <r.icon size={17} />
            </span>
            <span className="dAccountRowLabel">{r.label}</span>
            <span className="dAccountRowMeta">{r.sub}</span>
            <span className="dAccountRowArrow">
              <ArrowRightLeft size={14} style={{ transform: "rotate(0deg)" }} />
            </span>
          </a>
        ))}
      </div>

      {/* Logout */}
      <button className="dAccountLogout" onClick={handleLogout}>
        <span className="dAccountRowIcon">
          <LogOut size={17} />
        </span>
        <span className="dAccountRowLabel">Sign out</span>
      </button>
    </div>
  );
}
