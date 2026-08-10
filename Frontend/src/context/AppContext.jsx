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
import { connectSocket, disconnectSocket } from "../lib/socket";

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
  const [tokens, setTokens] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [teamFee, setTeamFeeState] = useState(2.25);

  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => loadJSON("theme", "light"));

  // Onboarding welcome modal — shown after a successful login/registration for
  // users who have not yet seen it. The "seen" flag lives in MongoDB
  // (user.hasSeenOnboarding) so it persists across devices, not just localStorage.
  const [onboardingOpen, setOnboardingOpen] = useState(false);

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
          const { user: authed } = await api("/auth/me");
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
    const [meRes, reqRes, notifRes, tokenRes] = await Promise.all([
      api("/users/me").catch(() => null),
      api("/requests").catch(() => null),
      api("/users/notifications").catch(() => null),
      api("/tokens").catch(() => null),
    ]);
    if (meRes) setTransactions((meRes.transactions || []).map(normalizeTransaction));
    if (reqRes) setPurchaseRequests(reqRes.requests || []);
    if (notifRes) setNotifications(notifRes.notifications || []);
    if (tokenRes) setTokens(tokenRes.tokens || []);
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

  /* ---------------- Realtime ---------------- */

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }
    const socket = connectSocket();

    const onNotification = (n) => {
      if (n.audience === "admins" && user.role !== "superadmin") return;
      setNotifications((prev) => [n, ...prev].slice(0, 50));
      notify(n.title || "New announcement", "default");
    };
    const onRequestStatus = () => loadUserData(user);
    const onTokensMinted = () => loadUserData(user);
    const onPropertiesChanged = async () => {
      try {
        const res = await api("/properties", { auth: false });
        setProperties(res.properties || []);
      } catch {
        /* non-critical */
      }
    };
    const onAccountChanged = (info) => {
      if (info?.status === "suspended") {
        setToken(null);
        setUser(null);
        setInitialized(false);
        notify("Your account has been suspended.", "error");
      } else if (info?.status === "active" && user?.status !== "active") {
        notify("Your account has been approved. Welcome aboard!", "success");
      }
    };

    socket.on("notification:new", onNotification);
    socket.on("request:status", onRequestStatus);
    socket.on("tokens:minted", onTokensMinted);
    socket.on("properties:changed", onPropertiesChanged);
    socket.on("account:changed", onAccountChanged);

    return () => {
      socket.off("notification:new", onNotification);
      socket.off("request:status", onRequestStatus);
      socket.off("tokens:minted", onTokensMinted);
      socket.off("properties:changed", onPropertiesChanged);
      socket.off("account:changed", onAccountChanged);
    };
  }, [user, notify, loadUserData]);

  /* ---------------- Actions ---------------- */

  async function login(email, password) {
    const data = await api("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(data.token);
    setUser(data.user);
    // First-ever login → show the onboarding welcome modal (DB flag: false).
    if (data.user && !data.user.hasSeenOnboarding) setOnboardingOpen(true);
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
    // New accounts have never seen onboarding → welcome them with the modal.
    if (data.user && !data.user.hasSeenOnboarding) setOnboardingOpen(true);
    notify(`Account created. Welcome, ${data.user.name}.`, "success");
    return { ok: true, user: data.user };
  }

  function logout() {
    setToken(null);
    setUser(null);
    setInitialized(false);
    setTransactions([]);
    setPurchaseRequests([]);
    setTokens([]);
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
      if (data.transaction) {
        // Instant settlement — the request came back already approved and
        // an ownership token was minted on the Flux Chain.
        setTransactions((prev) => [normalizeTransaction(data.transaction), ...prev]);
        if (data.token) setTokens((prev) => [data.token, ...prev]);
        if (data.property) {
          setProperties((prev) => prev.map((p) => (p.id === data.property.id ? data.property : p)));
        }
        notify(
          `Investment complete — ${data.request.shares} share${data.request.shares > 1 ? "s" : ""} in ${property.name} minted on the Flux Chain`,
          "success"
        );
      } else {
        notify(
          `Request submitted for ${data.request.shares} share${data.request.shares > 1 ? "s" : ""} in ${property.name} — pending team review`,
          "default"
        );
      }
      return { ok: true, request: data.request, transaction: data.transaction, token: data.token };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /* ---------------- Crypto payments ---------------- */

  async function createCryptoPayment(propertyId, shares, currency) {
    const data = await api("/payments/crypto/create", {
      method: "POST",
      body: { propertyId, shares, currency },
    });
    return data;
  }

  async function getCryptoPaymentStatus(id) {
    return api(`/payments/crypto/status/${id}`);
  }

  async function getCryptoRates() {
    return api("/payments/crypto/rates", { auth: false });
  }

  /** Close the onboarding modal and persist the "seen" flag to the DB. */
  async function dismissOnboarding() {
    setOnboardingOpen(false);
    try {
      const res = await api("/users/onboarding-complete", { method: "PATCH" });
      if (res.user) setUser((prev) => (prev ? { ...prev, hasSeenOnboarding: true } : prev));
    } catch {
      // Non-critical — worst case the modal shows once more next login.
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
    tokens,
    notifications,
    unreadNotifications,
    teamFee,
    login,
    adminLogin,
    register,
    logout,
    requestInvestment,
    createCryptoPayment,
    getCryptoPaymentStatus,
    getCryptoRates,
    markNotificationRead,
    onboardingOpen,
    dismissOnboarding,
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
