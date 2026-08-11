"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useApp } from "./AppContext";
import type {
  Activity,
  AdminSettingsState,
  AppNotification,
  ErrorLog,
  FinancialSeriesPoint,
  PlatformSettings,
  Property,
  PurchaseRequest,
  SiteContent,
  Transaction,
  User,
} from "@/lib/types";

export interface AdminStats {
  totalUsers?: number;
  pendingUsers?: number;
  totalAdmins?: number;
  activeProperties?: number;
  totalProperties?: number;
  fractionalProperties?: number;
  totalInvestments?: number;
  pendingRequests?: number;
  approvedRequests?: number;
  totalInvested?: number;
  totalRevenue?: number;
  teamEarnings?: number;
  pendingProperties?: number;
}

export interface Financials {
  totalInvested: number;
  totalFees: number;
  totalRevenue: number;
  platformEarnings: number;
  avgTicket: number;
  investments: number;
  series: FinancialSeriesPoint[];
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAdmin, notify } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [platform, setPlatform] = useState<PlatformSettings>({});
  const [settings, setSettings] = useState<AdminSettingsState>({ teamFee: 2.25, teamEarnings: 0 });

  const load = useCallback(async () => {
    const [
      statsRes,
      propsRes,
      usersRes,
      requestsRes,
      txRes,
      activityRes,
      errorsRes,
      contentRes,
      notifRes,
      settingsRes,
    ] = await Promise.all([
      api<{ stats?: AdminStats }>("/admin/stats").catch(() => null),
      api<{ properties?: Property[] }>("/admin/properties").catch(() => null),
      api<{ users?: User[] }>("/admin/users").catch(() => null),
      api<{ requests?: PurchaseRequest[] }>("/admin/requests").catch(() => null),
      api<{ transactions?: Transaction[] }>("/admin/transactions").catch(() => null),
      api<{ activities?: Activity[] }>("/admin/activity").catch(() => null),
      api<{ errors?: ErrorLog[] }>("/admin/errors").catch(() => null),
      api<{ content?: SiteContent }>("/admin/content").catch(() => null),
      api<{ notifications?: AppNotification[] }>("/admin/notifications").catch(() => null),
      api<{
        settings?: { platform?: PlatformSettings; teamFee?: number; teamEarnings?: number };
      }>("/settings", { auth: false }).catch(() => null),
    ]);

    if (statsRes) setStats(statsRes.stats || null);
    if (propsRes) setProperties(propsRes.properties || []);
    if (usersRes) setUsers(usersRes.users || []);
    if (requestsRes) setRequests(requestsRes.requests || []);
    if (txRes) setTransactions(txRes.transactions || []);
    if (activityRes) setActivity(activityRes.activities || []);
    if (errorsRes) setErrors(errorsRes.errors || []);
    if (contentRes) setContent(contentRes.content || null);
    if (notifRes) setNotifications(notifRes.notifications || []);
    if (settingsRes) {
      setPlatform(settingsRes.settings?.platform || {});
      setSettings({
        teamFee: settingsRes.settings?.teamFee ?? 2.25,
        teamEarnings: settingsRes.settings?.teamEarnings ?? 0,
      });
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    // Initial data load for the admin panel — setState happens after awaits inside load().
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [isAdmin, load]);

  // Live refresh: when anything the admin sees changes server-side,
  // refetch the admin dataset instead of waiting for a manual reload.
  // Debounced so bursts of events (e.g. several approvals in a row)
  // collapse into a single reload.
  useEffect(() => {
    if (!isAdmin) return;
    const socket = getSocket();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => load(), 300);
    };
    const events = [
      "requests:changed",
      "properties:changed",
      "users:changed",
      "notification:new",
      "settings:changed",
    ];
    events.forEach((ev) => socket.on(ev, refresh));
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => socket.off(ev, refresh));
    };
  }, [isAdmin, load]);

  // Polling fallback — if realtime is unavailable, periodically refresh the
  // admin dataset so new user requests / transactions still show up.
  useEffect(() => {
    if (!isAdmin) return;
    const s = getSocket();
    const id = setInterval(() => {
      if (s.connected) return;
      load();
    }, 30000);
    return () => clearInterval(id);
  }, [isAdmin, load]);

  const mutate = useCallback(
    async (fn: () => Promise<unknown>, successMsg?: string, errorMsg?: string) => {
      try {
        await fn();
        await load();
        if (successMsg) notify(successMsg, "success");
        return { ok: true as const };
      } catch (err) {
        notify(errorMsg || (err as Error).message, "error");
        return { ok: false as const, error: (err as Error).message };
      }
    },
    [load, notify]
  );

  /* ---------------- Requests / investments ---------------- */

  const approveRequest = (id: string) =>
    mutate(
      () => api(`/admin/requests/${id}/approve`, { method: "PATCH" }),
      "Purchase request approved."
    );

  const rejectRequest = (id: string) =>
    mutate(
      () =>
        api(`/admin/requests/${id}/reject`, {
          method: "PATCH",
          body: { reason: "Rejected by the team." },
        }),
      "Purchase request rejected."
    );

  /* ---------------- Properties ---------------- */

  const createProperty = (formData: unknown) =>
    mutate(
      () =>
        api("/admin/properties", {
          method: "POST",
          body: formData,
        }),
      "Property listed successfully."
    );

  const updateProperty = (id: string, formData: unknown) =>
    mutate(
      () =>
        api(`/admin/properties/${id}`, {
          method: "PUT",
          body: formData,
        }),
      "Property updated."
    );

  const deleteProperty = (id: string) =>
    mutate(() => api(`/admin/properties/${id}`, { method: "DELETE" }), "Property removed.");

  const setPropertyStatus = (id: string, action: string) =>
    mutate(
      () =>
        api(`/admin/properties/${id}/status`, {
          method: "PATCH",
          body: { action },
        }),
      action === "approve" ? "Listing approved." : "Listing rejected."
    );

  const toggleFeatured = (id: string, featured: boolean) =>
    mutate(() =>
      api(`/admin/properties/${id}/featured`, {
        method: "PATCH",
        body: { featured },
      })
    );

  const toggleInvesting = (id: string, open: boolean) =>
    mutate(
      () =>
        api(`/admin/properties/${id}/investing`, {
          method: "PATCH",
          body: { open },
        }),
      open ? "Investing resumed." : "Investing paused."
    );

  /* ---------------- Users ---------------- */

  const setUserStatus = (id: string, action: string) =>
    mutate(
      () =>
        api(`/admin/users/${id}/status`, {
          method: "PATCH",
          body: { action },
        }),
      "User status updated."
    );

  const updateUser = (id: string, data: unknown) =>
    mutate(
      () =>
        api(`/admin/users/${id}`, {
          method: "PUT",
          body: data,
        }),
      "User updated."
    );

  const deleteUser = (id: string) =>
    mutate(() => api(`/admin/users/${id}`, { method: "DELETE" }), "User deleted.");

  /* ---------------- Content / notifications / settings ---------------- */

  const saveContent = (nextContent: SiteContent) =>
    mutate(
      () =>
        api("/admin/content", {
          method: "PUT",
          body: nextContent,
        }),
      "Content saved."
    );

  const sendNotification = (data: unknown) =>
    mutate(
      () =>
        api("/admin/notifications", {
          method: "POST",
          body: data,
        }),
      "Announcement sent."
    );

  const deleteNotification = (id: string) =>
    mutate(
      () => api(`/admin/notifications/${id}`, { method: "DELETE" }),
      "Notification removed."
    );

  const savePlatform = (data: unknown) =>
    mutate(
      () =>
        api("/admin/platform", {
          method: "PUT",
          body: data,
        }),
      "Platform settings saved."
    );

  const saveSettings = (data: unknown) =>
    mutate(
      () =>
        api("/admin/settings", {
          method: "PUT",
          body: data,
        }),
      "Settings saved."
    );

  const financials = useMemo<Financials>(() => {
    const totalInvested = transactions.reduce((s, t) => s + t.total, 0);
    const totalFees = transactions.reduce((s, t) => s + (t.teamFee || 0), 0);
    const byMonth = new Map<string, FinancialSeriesPoint>();
    for (const t of transactions) {
      const d = t.createdAt ? new Date(t.createdAt) : new Date();
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const entry = byMonth.get(key) || { month: key, invested: 0, fees: 0, count: 0 };
      entry.invested += t.total;
      entry.fees += t.teamFee || 0;
      entry.count += 1;
      byMonth.set(key, entry);
    }
    const series = Array.from(byMonth.values()).sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
    );
    return {
      totalInvested,
      totalFees,
      totalRevenue: totalInvested + settings.teamEarnings,
      platformEarnings: settings.teamEarnings,
      avgTicket: transactions.length ? totalInvested / transactions.length : 0,
      investments: transactions.length,
      series,
    };
  }, [transactions, settings]);

  const value: AdminContextValue = {
    loading,
    stats,
    properties,
    users,
    requests,
    transactions,
    activity,
    errors,
    content,
    notifications,
    platform,
    settings,
    financials,
    load,
    approveRequest,
    rejectRequest,
    createProperty,
    updateProperty,
    deleteProperty,
    setPropertyStatus,
    toggleFeatured,
    toggleInvesting,
    setUserStatus,
    updateUser,
    deleteUser,
    saveContent,
    sendNotification,
    deleteNotification,
    savePlatform,
    saveSettings,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export interface AdminContextValue {
  loading: boolean;
  stats: AdminStats | null;
  properties: Property[];
  users: User[];
  requests: PurchaseRequest[];
  transactions: Transaction[];
  activity: Activity[];
  errors: ErrorLog[];
  content: SiteContent | null;
  notifications: AppNotification[];
  platform: PlatformSettings;
  settings: AdminSettingsState;
  financials: Financials;
  load: () => Promise<void>;
  approveRequest: (id: string) => Promise<MutateResult>;
  rejectRequest: (id: string) => Promise<MutateResult>;
  createProperty: (formData: unknown) => Promise<MutateResult>;
  updateProperty: (id: string, formData: unknown) => Promise<MutateResult>;
  deleteProperty: (id: string) => Promise<MutateResult>;
  setPropertyStatus: (id: string, action: string) => Promise<MutateResult>;
  toggleFeatured: (id: string, featured: boolean) => Promise<MutateResult>;
  toggleInvesting: (id: string, open: boolean) => Promise<MutateResult>;
  setUserStatus: (id: string, action: string) => Promise<MutateResult>;
  updateUser: (id: string, data: unknown) => Promise<MutateResult>;
  deleteUser: (id: string) => Promise<MutateResult>;
  saveContent: (content: SiteContent) => Promise<MutateResult>;
  sendNotification: (data: unknown) => Promise<MutateResult>;
  deleteNotification: (id: string) => Promise<MutateResult>;
  savePlatform: (data: unknown) => Promise<MutateResult>;
  saveSettings: (data: unknown) => Promise<MutateResult>;
}

export type MutateResult = { ok: boolean; error?: string };

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
