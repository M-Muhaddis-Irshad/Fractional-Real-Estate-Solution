import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { money } from "../lib/format";

export default function Header() {
  const { wallet, portfolioTotals, pendingRequests, topUpWallet, theme, toggleTheme, resetDemo } = useApp();
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const topUpRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (topUpRef.current && !topUpRef.current.contains(e.target)) {
        setShowTopUp(false);
      }
    };
    if (showTopUp) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTopUp]);

  const handleTopUp = (amount) => {
    topUpWallet(amount);
    setShowTopUp(false);
    setTopUpAmount("");
  };

  return (
    <header className="header">
      <NavLink to="/" className="brand">
        <div className="mark">⟡</div>
        <div>
          <div className="brandName">Fractional</div>
          <div className="brandSub">ownership, by the share</div>
        </div>
      </NavLink>

      <nav className="tabs">
        <NavLink to="/" end className={({ isActive }) => "tabBtn" + (isActive ? " tabBtnActive" : "")}>
          Discover
        </NavLink>
        <NavLink
          to="/portfolio"
          className={({ isActive }) => "tabBtn" + (isActive ? " tabBtnActive" : "")}
        >
          My Ledger {portfolioTotals.count > 0 ? `(${portfolioTotals.count})` : ""}
        </NavLink>
        <NavLink
          to="/team"
          className={({ isActive }) => "tabBtn" + (isActive ? " tabBtnActive" : "")}
        >
          Team {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ""}
        </NavLink>
        <NavLink
          to="/list"
          className={({ isActive }) => "tabBtn" + (isActive ? " tabBtnActive" : "")}
        >
          + List
        </NavLink>
      </nav>

      <div className="headerRight">
        <div className="walletPill" ref={topUpRef}>
          <button className="walletInner" onClick={() => setShowTopUp((v) => !v)}>
            <span className="walletLabel">Wallet</span>
            <span className="walletValue" title={money(wallet)}>{money(wallet)}</span>
            <span className="walletCaret">{showTopUp ? "▲" : "▼"}</span>
          </button>
          {showTopUp && (
            <div className="topUpDropdown">
              <div className="topUpPresets">
                {[100000, 500000, 1000000].map((amt) => (
                  <button key={amt} className="topUpPresetBtn" onClick={() => handleTopUp(amt)}>
                    {money(amt)}
                  </button>
                ))}
              </div>
              <div className="topUpCustom">
                <input
                  className="topUpInput"
                  type="number"
                  placeholder="Custom amount"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && topUpAmount) handleTopUp(topUpAmount);
                  }}
                />
                <button
                  className="topUpGoBtn"
                  disabled={!topUpAmount}
                  onClick={() => handleTopUp(topUpAmount)}
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
        <label className="themeToggle" title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          <input type="checkbox" checked={theme === "light"} onChange={toggleTheme} />
          <span className="toggleTrack">
            <span className="toggleKnob">{theme === "dark" ? "☾" : "☀"}</span>
          </span>
        </label>
        <button className="resetBtn" onClick={resetDemo}>
          Reset demo
        </button>
      </div>
    </header>
  );
}
