import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SEED_PROPERTIES, STARTING_WALLET_BALANCE } from "../data/properties";
import { loadJSON, saveJSON, clearAll } from "../lib/storage";
import { money } from "../lib/format";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [properties, setProperties] = useState(() => loadJSON("properties", SEED_PROPERTIES));
  const [transactions, setTransactions] = useState(() => loadJSON("transactions", []));
  const [wallet, setWallet] = useState(() => loadJSON("wallet", STARTING_WALLET_BALANCE));
  const [purchaseRequests, setPurchaseRequests] = useState(() => loadJSON("purchaseRequests", []));
  const [teamFee, setTeamFeeState] = useState(() => loadJSON("teamFee", 2.25));
  const [teamEarnings, setTeamEarnings] = useState(() => loadJSON("teamEarnings", 0));
  const [toast, setToast] = useState(null);

  useEffect(() => { saveJSON("properties", properties); }, [properties]);
  useEffect(() => { saveJSON("transactions", transactions); }, [transactions]);
  useEffect(() => { saveJSON("wallet", wallet); }, [wallet]);
  useEffect(() => { saveJSON("purchaseRequests", purchaseRequests); }, [purchaseRequests]);
  useEffect(() => { saveJSON("teamFee", teamFee); }, [teamFee]);
  useEffect(() => { saveJSON("teamEarnings", teamEarnings); }, [teamEarnings]);

  const [theme, setTheme] = useState(() => loadJSON("theme", "dark"));

  useEffect(() => { saveJSON("theme", theme); }, [theme]);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const notify = (message, tone = "default") => {
    setToast({ message, tone, id: Date.now() });
  };

  const dismissToast = () => setToast(null);

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

  function requestInvestment(propertyId, shareCount) {
    const property = properties.find((p) => p.id === propertyId);
    if (!property) return { ok: false, error: "Property not found." };

    const remaining = property.totalShares - property.soldShares;
    const count = Math.min(Math.max(1, Math.floor(shareCount)), remaining);
    if (count <= 0) return { ok: false, error: "This property is fully subscribed." };

    const totalCost = count * property.pricePerShare;
    const teamFeeAmount = (totalCost * teamFee) / 100;

    const request = {
      id: `req_${Date.now()}`,
      propertyId,
      propertyName: property.name,
      shares: count,
      pricePerShare: property.pricePerShare,
      totalCost,
      teamFeePct: teamFee,
      teamFeeAmount,
      status: "pending",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toISOString().slice(11, 16),
    };

    setPurchaseRequests((prev) => [request, ...prev]);
    notify(
      `Request submitted for ${count} share${count > 1 ? "s" : ""} in ${property.name} — awaiting team approval`,
      "default"
    );

    return { ok: true, request };
  }

  function processRequest(requestId, action) {
    const request = purchaseRequests.find((r) => r.id === requestId);
    if (!request) return { ok: false, error: "Request not found." };
    if (request.status !== "pending") return { ok: false, error: "Request already processed." };

    if (action === "reject") {
      setPurchaseRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "rejected", processedAt: new Date().toISOString() } : r))
      );
      notify(`Request for ${request.propertyName} rejected.`, "default");
      return { ok: true };
    }

    if (action === "approve") {
      if (request.totalCost > wallet) {
        return { ok: false, error: "Insufficient wallet balance to approve this request." };
      }

      const property = properties.find((p) => p.id === request.propertyId);
      if (!property) return { ok: false, error: "Property not found." };
      const remaining = property.totalShares - property.soldShares;
      if (request.shares > remaining) {
        return { ok: false, error: "Not enough shares remaining for this request." };
      }

      setWallet((prev) => prev - request.totalCost);
      setProperties((prev) =>
        prev.map((p) =>
          p.id === request.propertyId ? { ...p, soldShares: p.soldShares + request.shares } : p
        )
      );

      const transaction = {
        id: `tx_${Date.now()}`,
        propertyId: request.propertyId,
        name: request.propertyName,
        shares: request.shares,
        pricePerShare: request.pricePerShare,
        total: request.totalCost,
        teamFee: request.teamFeeAmount,
        teamFeePct: request.teamFeePct,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toISOString().slice(11, 16),
      };
      setTransactions((prev) => [transaction, ...prev]);
      setTeamEarnings((prev) => prev + request.teamFeeAmount);
      setPurchaseRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "approved", processedAt: new Date().toISOString() } : r))
      );

      notify(
        `Approved: ${request.shares} share${request.shares > 1 ? "s" : ""} in ${request.propertyName}`,
        "success"
      );
      return { ok: true, transaction };
    }

    return { ok: false, error: "Invalid action." };
  }

  function setTeamFee(val) {
    setTeamFeeState(Math.min(2.5, Math.max(2, val)));
  }

  function addProperty(data) {
    const initials = data.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const hue = Math.floor(Math.random() * 360);
    const property = {
      id: `p_${Date.now()}`,
      name: data.name,
      city: data.city,
      type: data.type,
      description: data.description,
      totalValue: parseInt(data.totalValue, 10),
      pricePerShare: parseInt(data.pricePerShare, 10),
      totalShares: parseInt(data.totalShares, 10),
      soldShares: 0,
      yieldPct: parseFloat(data.yieldPct),
      initials,
      hue,
    };
    setProperties((prev) => [...prev, property]);
    notify(`"${property.name}" listed successfully`, "success");
    return { ok: true, property };
  }

  function topUpWallet(amount) {
    const val = Math.max(0, Math.floor(parseInt(amount, 10)));
    if (!val || val <= 0) return { ok: false, error: "Invalid amount." };
    setWallet((prev) => prev + val);
    notify(`Wallet topped up by ${money(val)}`, "success");
    return { ok: true };
  }

  function resetDemo() {
    setProperties(SEED_PROPERTIES);
    setTransactions([]);
    setWallet(STARTING_WALLET_BALANCE);
    setPurchaseRequests([]);
    setTeamFeeState(2.25);
    setTeamEarnings(0);
    clearAll(["properties", "transactions", "wallet", "purchaseRequests", "teamFee", "teamEarnings"]);
    notify("Demo reset to starting state.", "default");
  }

  const value = {
    properties,
    transactions,
    holdings,
    portfolioTotals,
    wallet,
    purchaseRequests,
    pendingRequests,
    teamFee,
    teamEarnings,
    requestInvestment,
    processRequest,
    setTeamFee,
    topUpWallet,
    addProperty,
    theme,
    toggleTheme,
    resetDemo,
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
