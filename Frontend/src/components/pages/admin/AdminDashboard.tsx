"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  Megaphone,
  PieChart,
  Plus,
  Users,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useApp } from "@/context/AppContext";
import { AreaTrend, Donut } from "@/components/Charts";
import Avatar from "@/components/Avatar";
import { money, moneyShort, timeAgo, fmtDateTime } from "@/lib/format";
import type { Activity } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  register: "User registered",
  google_signup: "Google sign-up",
  login: "User login",
  admin_login: "Admin login",
  google_signin: "Google sign-in",
  terms_accepted: "Terms accepted",
  password_reset_requested: "Password reset requested",
  password_reset: "Password reset",
  password_changed: "Password changed",
  profile_updated: "Profile updated",
  avatar_updated: "Avatar updated",
  request_submitted: "Purchase request",
  request_approved: "Request approved",
  request_rejected: "Request rejected",
  property_listed: "Property listed",
  property_approved: "Property approved",
  property_rejected: "Property rejected",
  content_updated: "Content updated",
  notification_sent: "Notification sent",
  settings_updated: "Settings updated",
  user_approved: "User approved",
  user_rejected: "User rejected",
  user_suspended: "User suspended",
  user_restored: "User restored",
  user_edited: "User edited",
  payment_confirmed: "Payment confirmed",
};

function actorName(a: Activity): string {
  return a.actor?.name || a.user?.name || "System";
}

function activityMessage(a: Activity): string {
  if (a.message) return a.message;
  if (a.type && TYPE_LABELS[a.type]) return TYPE_LABELS[a.type];
  if (a.type) return a.type.replace(/_/g, " ");
  return "Activity recorded";
}

function typeLabel(a: Activity): string {
  if (a.type && TYPE_LABELS[a.type]) return TYPE_LABELS[a.type];
  if (a.type) return a.type.replace(/_/g, " ");
  return "";
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="kpi" style={accent ? { borderTop: `3px solid ${accent}` } : undefined}>
      <div className="kpiLabel">{label}</div>
      <div className="kpiValue">{value}</div>
      {sub && <div className="kpiSub">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const {
    stats,
    requests,
    activity,
    transactions,
    properties,
    approveRequest,
    rejectRequest,
    loading,
  } = useAdmin();
  const { user } = useApp();

  const pendingRequests = useMemo(
    () => (requests || []).filter((r) => r.status === "pending"),
    [requests]
  );

  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; invested: number; fees: number }>();
    for (const t of transactions) {
      const d = t.createdAt ? new Date(t.createdAt) : new Date();
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const entry = map.get(key) || { month: key, invested: 0, fees: 0 };
      entry.invested += t.total;
      entry.fees += t.teamFee || 0;
      map.set(key, entry);
    }
    return Array.from(map.values())
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12);
  }, [transactions]);

  const typeSplit = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of properties) map.set(p.type, (map.get(p.type) || 0) + 1);
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [properties]);

  if (loading) {
    return (
      <div className="aPageLoading">
        <div className="spinner" />
      </div>
    );
  }

  const s = stats || {};

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Admin panel</div>
          <h1 className="pageTitle">Platform overview</h1>
          <p className="pageSub">
            Monitor the entire Flux platform in real time, {user?.name?.split(" ")[0]}.
          </p>
        </div>
        <div className="aHeadActions">
          <Link href="/admin/properties/new" className="btn btnPrimary">
            <Plus size={15} /> List property
          </Link>
          <Link href="/admin/investments" className="btn btnGhost">
            Review requests
          </Link>
        </div>
      </div>

      <div className="kpiGrid">
        <Kpi label="Total users" value={s.totalUsers ?? "—"} sub={`${s.pendingUsers ?? 0} pending approval`} />
        <Kpi label="Total admins" value={s.totalAdmins ?? "—"} sub={`${s.activeProperties ?? 0} active listings`} />
        <Kpi label="Properties" value={s.totalProperties ?? "—"} sub={`${s.fractionalProperties ?? 0} fractional offerings`} />
        <Kpi label="Total investments" value={s.totalInvestments ?? "—"} sub={`${s.pendingRequests ?? 0} awaiting approval`} />
        <Kpi label="Total invested" value={money(s.totalInvested || 0)} sub="All-time capital deployed" accent="#d98e3b" />
        <Kpi label="Total revenue" value={money(s.totalRevenue || 0)} sub={`incl. ${moneyShort(s.teamEarnings || 0)} fees`} accent="#10b981" />
        <Kpi label="Active listings" value={s.activeProperties ?? "—"} sub={`${s.pendingProperties ?? 0} pending review`} />
        <Kpi label="Pending approvals" value={s.pendingRequests ?? "—"} sub={`${s.approvedRequests ?? 0} approved to date`} accent="#f59e0b" />
      </div>

      <div className="grid-2-1">
        <div className="card cardPad">
          <div className="dChartHead">
            <div>
              <div className="cardTitle">Investment trend</div>
              <div className="cardSub">Monthly invested capital</div>
            </div>
          </div>
          {monthly.length >= 2 ? (
            <AreaTrend data={monthly} dataKey="invested" height={250} />
          ) : (
            <div className="dChartEmpty">Not enough data yet.</div>
          )}
        </div>
        <div className="card cardPad">
          <div className="dChartHead">
            <div>
              <div className="cardTitle">Property mix</div>
              <div className="cardSub">By asset type</div>
            </div>
          </div>
          {typeSplit.length ? <Donut data={typeSplit} height={210} /> : <div className="dChartEmpty">No properties.</div>}
        </div>
      </div>

      <div className="grid-2-1 aLowerGrid">
        <div className="card">
          <div className="cardHead">
            <div>
              <div className="cardTitle">Recent activity</div>
              <div className="cardSub">Latest platform events</div>
            </div>
          </div>
          <div className="aActivityList">
            {activity.slice(0, 8).map((a, i) => (
              <div className="aActivityRow" key={a.id ?? `activity-${i}`}>
                <Avatar name={actorName(a)} size="sm" />
                <div className="aActivityBody">
                  <div className="aActivityMsg">{activityMessage(a)}</div>
                  <div className="aActivityMeta">
                    {actorName(a) + " · "}
                    {timeAgo(a.createdAt)}
                  </div>
                </div>
                <span className="aActivityType">
                  {typeLabel(a)}
                </span>
              </div>
            ))}
            {activity.length === 0 && <div className="dCardBodyEmpty">No activity recorded yet.</div>}
          </div>
        </div>

        <div className="card">
          <div className="cardHead">
            <div>
              <div className="cardTitle">Pending approvals</div>
              <div className="cardSub">Purchase requests awaiting review</div>
            </div>
            <Link href="/admin/investments" className="dLink">
              All <ArrowRight size={12} />
            </Link>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="dCardBodyEmpty">All caught up — no pending requests.</div>
          ) : (
            <div className="aApproveList">
              {pendingRequests.slice(0, 5).map((r) => (
                <div className="aApproveRow" key={r.id}>
                  <div>
                    <div className="dMiniName">{r.propertyName}</div>
                    <div className="dMiniMeta">
                      {r.user?.name} · {r.shares} shares · {fmtDateTime(r.createdAt)}
                    </div>
                  </div>
                  <div className="aApproveRight">
                    <div className="aApproveAmount">{money(r.totalCost)}</div>
                    <div className="aApproveBtns">
                      <button className="btn btnSuccess btnSm" onClick={() => approveRequest(r.id)}>
                        Approve
                      </button>
                      <button className="btn btnDanger btnSm" onClick={() => rejectRequest(r.id)}>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sectionHeading">Quick links</div>
      <div className="grid3">
        {[
          { icon: Building2, title: "Property management", sub: "Approve listings, edit assets, manage status.", to: "/admin/properties" },
          { icon: PieChart, title: "Fractional offerings", sub: "Configure shares, pricing and pause/resume.", to: "/admin/fractional" },
          { icon: Users, title: "User management", sub: "Review, suspend and promote accounts.", to: "/admin/users" },
          { icon: BarChart3, title: "Financial dashboard", sub: "Revenue analytics and commission tracking.", to: "/admin/financials" },
          { icon: FileText, title: "Content management", sub: "Edit homepage hero, FAQ, testimonials and blog.", to: "/admin/content" },
          { icon: Megaphone, title: "Announcements", sub: "Compose and send platform notifications.", to: "/admin/notifications" },
        ].map((q) => (
          <Link href={q.to} className="dQuick" key={q.to}>
            <span className="dQuickIcon">
              <q.icon size={17} />
            </span>
            <div>
              <div className="dQuickTitle">{q.title}</div>
              <div className="dQuickSub">{q.sub}</div>
            </div>
            <span className="dQuickArrow">
              <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
