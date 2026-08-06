import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, getToken, setToken } from "../lib/api";
import { loadJSON, saveJSON } from "../lib/storage";

const AppContext = createContext(null);

function normalizeTransaction(t) {
  return {
    ...t,
    id: String(t.id ?? t._id),
    propertyId: String(t.propertyId),
    name: t.name || t.propertyName,
  };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [properties, setProperties] = useState([]);
  const [content, setContent] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [teamFee, setTeamFeeState] = useState(2.25);

  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => loadJSON("theme", "light"));

  useEffect(() => {
    saveJSON("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const notify = useCallback((message, tone = "default") => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  /* ---------------- Auth bootstrap ---------------- */

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (getToken()) {
          const { user: authed } = await api("/auth/me", { auth: false });
          if (active) setUser(authed);
        }
      } catch {
        setToken(null);
      } finally {
        if (active) setAuthChecked(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /* ---------------- Data loading ---------------- */

  const loadUserData = useCallback(async (authedUser) => {
    const [meRes, reqRes, notifRes] = await Promise.all([
      api("/users/me").catch(() => null),
      api("/requests").catch(() => null),
      api("/users/notifications").catch(() => null),
    ]);
    if (meRes) setTransactions((meRes.transactions || []).map(normalizeTransaction));
    if (reqRes) setPurchaseRequests(reqRes.requests || []);
    if (notifRes) setNotifications(notifRes.notifications || []);
    return authedUser;
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    let active = true;

    (async () => {
      try {
        const [propsRes, settingsRes, contentRes] = await Promise.all([
          api("/properties", { auth: false }),
          api("/settings", { auth: false }),
          api("/settings/content", { auth: false }),
        ]);
        if (!active) return;
        setProperties(propsRes.properties || []);
        setTeamFeeState(settingsRes.settings.teamFee ?? 2.25);
        setContent(contentRes.content);

        if (user) await loadUserData(user);
      } catch (err) {
        if (active) notify(err.message, "error");
      } finally {
        if (active) setInitialized(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [authChecked, user, notify, loadUserData]);

  /* ---------------- Derived ---------------- */

  const holdings = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      const existing = map.get(t.propertyId);
      if (existing) {
        existing.shares += t.shares;
        existing.invested += t.total;
      } else {
        map.set(t.propertyId, {
          propertyId: t.propertyId,
          name: t.name,
          shares: t.shares,
          invested: t.total,
        });
      }
    }
    return Array.from(map.values());
  }, [transactions]);

  const portfolioTotals = useMemo(
    () =>
      holdings.reduce(
        (acc, h) => ({
          invested: acc.invested + h.invested,
          shares: acc.shares + h.shares,
          count: acc.count + 1,
        }),
        { invested: 0, shares: 0, count: 0 }
      ),
    [holdings]
  );

  const pendingRequests = useMemo(
    () => purchaseRequests.filter((r) => r.status === "pending"),
    [purchaseRequests]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const portfolioSeries = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)
    );
    return sorted.reduce((acc, t) => {
      const invested = (acc.length ? acc[acc.length - 1].invested : 0) + t.total;
      return acc.concat({
        label: t.date || (t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : ""),
        invested,
      });
    }, []);
  }, [transactions]);

  /* ---------------- Actions ---------------- */

  async function login(email, password) {
    const data = await api("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(data.token);
    setUser(data.user);
    notify(`Welcome back, ${data.user.name}.`, "success");
    return { ok: true, user: data.user };
  }

  async function adminLogin(email, password) {
    const data = await api("/auth/admin-login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(data.token);
    setUser(data.user);
    notify(`Welcome to the admin panel, ${data.user.name}.`, "success");
    return { ok: true, user: data.user };
  }

  async function register({ name, email, password, acceptedTerms }) {
    const data = await api("/auth/register", {
      method: "POST",
      body: { name, email, password, acceptedTerms },
      auth: false,
    });
    setToken(data.token);
    setUser(data.user);
    notify(`Account created. Welcome, ${data.user.name}.`, "success");
    return { ok: true, user: data.user };
  }

  function logout() {
    setToken(null);
    setUser(null);
    setInitialized(false);
    setTransactions([]);
    setPurchaseRequests([]);
    setNotifications([]);
    notify("Signed out.", "default");
  }

  async function requestInvestment(propertyId, shareCount) {
    const property = properties.find((p) => p.id === propertyId);
    if (!property) return { ok: false, error: "Property not found." };
    if (!property.investingOpen) {
      return { ok: false, error: "Investing is currently paused for this property." };
    }
    const remaining = property.totalShares - property.soldShares;
    if (remaining <= 0) {
      return { ok: false, error: "This property is fully subscribed." };
    }
    try {
      const data = await api("/requests", {
        method: "POST",
        body: { propertyId, shares: shareCount },
      });
      setPurchaseRequests((prev) => [data.request, ...prev]);
      notify(
        `Request submitted for ${data.request.shares} share${data.request.shares > 1 ? "s" : ""} in ${property.name} — awaiting team approval`,
        "default"
      );
      return { ok: true, request: data.request };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function markNotificationRead(id) {
    try {
      await api(`/users/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      /* non-critical */
    }
  }

  const value = {
    user,
    authChecked,
    initialized,
    isAdmin: user && user.role === "superadmin",
    properties,
    content,
    transactions,
    holdings,
    portfolioTotals,
    portfolioSeries,
    purchaseRequests,
    pendingRequests,
    notifications,
    unreadNotifications,
    teamFee,
    login,
    adminLogin,
    register,
    logout,
    requestInvestment,
    markNotificationRead,
    theme,
    toggleTheme,
    toast,
    notify,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
