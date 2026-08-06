import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../lib/api";
import { useApp } from "./AppContext";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const { isAdmin, notify } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [errors, setErrors] = useState([]);
  const [content, setContent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [platform, setPlatform] = useState({});
  const [settings, setSettings] = useState({ teamFee: 2.25, teamEarnings: 0 });

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
      api("/admin/stats").catch(() => null),
      api("/admin/properties").catch(() => null),
      api("/admin/users").catch(() => null),
      api("/admin/requests").catch(() => null),
      api("/admin/transactions").catch(() => null),
      api("/admin/activity").catch(() => null),
      api("/admin/errors").catch(() => null),
      api("/admin/content").catch(() => null),
      api("/admin/notifications").catch(() => null),
      api("/settings", { auth: false }).catch(() => null),
    ]);

    if (statsRes) setStats(statsRes.stats);
    if (propsRes) setProperties(propsRes.properties || []);
    if (usersRes) setUsers(usersRes.users || []);
    if (requestsRes) setRequests(requestsRes.requests || []);
    if (txRes) setTransactions(txRes.transactions || []);
    if (activityRes) setActivity(activityRes.activities || []);
    if (errorsRes) setErrors(errorsRes.errors || []);
    if (contentRes) setContent(contentRes.content);
    if (notifRes) setNotifications(notifRes.notifications || []);
    if (settingsRes) {
      setPlatform(settingsRes.settings.platform || {});
      setSettings({
        teamFee: settingsRes.settings.teamFee ?? 2.25,
        teamEarnings: settingsRes.settings.teamEarnings ?? 0,
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

  const mutate = useCallback(
    async (fn, successMsg, errorMsg) => {
      try {
        await fn();
        await load();
        if (successMsg) notify(successMsg, "success");
        return { ok: true };
      } catch (err) {
        notify(errorMsg || err.message, "error");
        return { ok: false, error: err.message };
      }
    },
    [load, notify]
  );

  /* ---------------- Requests / investments ---------------- */

  const approveRequest = (id) =>
    mutate(
      () => api(`/admin/requests/${id}/approve`, { method: "PATCH" }),
      "Purchase request approved."
    );

  const rejectRequest = (id) =>
    mutate(
      () =>
        api(`/admin/requests/${id}/reject`, {
          method: "PATCH",
          body: { reason: "Rejected by the team." },
        }),
      "Purchase request rejected."
    );

  /* ---------------- Properties ---------------- */

  const createProperty = (formData) =>
    mutate(
      () =>
        api("/admin/properties", {
          method: "POST",
          body: formData,
        }),
      "Property listed successfully."
    );

  const updateProperty = (id, formData) =>
    mutate(
      () =>
        api(`/admin/properties/${id}`, {
          method: "PUT",
          body: formData,
        }),
      "Property updated."
    );

  const deleteProperty = (id) =>
    mutate(
      () => api(`/admin/properties/${id}`, { method: "DELETE" }),
      "Property removed."
    );

  const setPropertyStatus = (id, action) =>
    mutate(
      () =>
        api(`/admin/properties/${id}/status`, {
          method: "PATCH",
          body: { action },
        }),
      action === "approve" ? "Listing approved." : "Listing rejected."
    );

  const toggleFeatured = (id, featured) =>
    mutate(
      () =>
        api(`/admin/properties/${id}/featured`, {
          method: "PATCH",
          body: { featured },
        })
    );

  const toggleInvesting = (id, open) =>
    mutate(
      () =>
        api(`/admin/properties/${id}/investing`, {
          method: "PATCH",
          body: { open },
        }),
      open ? "Investing resumed." : "Investing paused."
    );

  /* ---------------- Users ---------------- */

  const setUserStatus = (id, action) =>
    mutate(
      () =>
        api(`/admin/users/${id}/status`, {
          method: "PATCH",
          body: { action },
        }),
      "User status updated."
    );

  const updateUser = (id, data) =>
    mutate(
      () =>
        api(`/admin/users/${id}`, {
          method: "PUT",
          body: data,
        }),
      "User updated."
    );

  const deleteUser = (id) =>
    mutate(
      () => api(`/admin/users/${id}`, { method: "DELETE" }),
      "User deleted."
    );

  /* ---------------- Content / notifications / settings ---------------- */

  const saveContent = (nextContent) =>
    mutate(
      () =>
        api("/admin/content", {
          method: "PUT",
          body: nextContent,
        }),
      "Content saved."
    );

  const sendNotification = (data) =>
    mutate(
      () =>
        api("/admin/notifications", {
          method: "POST",
          body: data,
        }),
      "Announcement sent."
    );

  const deleteNotification = (id) =>
    mutate(
      () => api(`/admin/notifications/${id}`, { method: "DELETE" }),
      "Notification removed."
    );

  const savePlatform = (data) =>
    mutate(
      () =>
        api("/admin/platform", {
          method: "PUT",
          body: data,
        }),
      "Platform settings saved."
    );

  const saveSettings = (data) =>
    mutate(
      () =>
        api("/admin/settings", {
          method: "PUT",
          body: data,
        }),
      "Settings saved."
    );

  const financials = useMemo(() => {
    const totalInvested = transactions.reduce((s, t) => s + t.total, 0);
    const totalFees = transactions.reduce((s, t) => s + (t.teamFee || 0), 0);
    const byMonth = new Map();
    for (const t of transactions) {
      const d = t.createdAt ? new Date(t.createdAt) : new Date();
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const entry = byMonth.get(key) || { month: key, invested: 0, fees: 0, count: 0 };
      entry.invested += t.total;
      entry.fees += t.teamFee || 0;
      entry.count += 1;
      byMonth.set(key, entry);
    }
    return {
      totalInvested,
      totalFees,
      totalRevenue: totalInvested + settings.teamEarnings,
      platformEarnings: settings.teamEarnings,
      series: Array.from(byMonth.values()).sort(
        (a, b) => new Date(a.month) - new Date(b.month)
      ),
    };
  }, [transactions, settings]);

  const value = {
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

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
