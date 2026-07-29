import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { money } from "../lib/format";
const LOGO = "/logo/logo.png";

export default function Header() {
  const { wallet, portfolioTotals, pendingRequests, topUpWallet, theme, toggleTheme, resetDemo } = useApp();
  const [showProfile, setShowProfile] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    if (showProfile) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfile]);

  const handleTopUp = (amount) => {
    topUpWallet(amount);
    setTopUpAmount("");
  };

  return (
    <div className="headerOuter">
      <header className="header">
        <div className="headerLeft">
          <NavLink to="/" className="brand">
            <img src={LOGO} alt="Fractional" className="mark" />
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
              to="/profile"
              className={({ isActive }) => "tabBtn" + (isActive ? " tabBtnActive" : "")}
            >
              Profile
            </NavLink>
            <NavLink
              to="/list"
              className={({ isActive }) => "tabBtn" + (isActive ? " tabBtnActive" : "")}
            >
              + List
            </NavLink>
          </nav>
        </div>

        <div className="headerRight">
          <label className="themeToggle" title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            <input type="checkbox" checked={theme === "light"} onChange={toggleTheme} />
            <span className="toggleTrack">
              <span className="toggleKnob">{theme === "dark" ? "☾" : "☀"}</span>
            </span>
          </label>
          <div className="profileWidget" ref={profileRef}>
            <button className="profileAvatar" onClick={() => setShowProfile((v) => !v)}>
              <span className="avatarLetter">I</span>
              <span className="profileCaret">{showProfile ? "▲" : "▼"}</span>
            </button>
            {showProfile && (
              <div className="profileDropdown">
                <div className="profileDropdownHead">
                  <div className="avatarLarge">I</div>
                  <div>
                    <div className="profileDropdownName">Investor</div>
                    <div className="profileDropdownWallet">{money(wallet)}</div>
                  </div>
                </div>
                <div className="profileDropdownBody">
                  <div className="profileDropdownRow">
                    <span>Wallet balance</span>
                    <span className="profileDropdownVal">{money(wallet)}</span>
                  </div>
                  <div className="profileDropdownRow">
                    <span>Total invested</span>
                    <span className="profileDropdownVal">{money(portfolioTotals.invested)}</span>
                  </div>
                  <div className="profileDropdownRow">
                    <span>Properties held</span>
                    <span className="profileDropdownVal">{portfolioTotals.count}</span>
                  </div>
                </div>
                <div className="profileDropdownActions">
                  <div className="topUpRow">
                    <input
                      className="topUpInput"
                      type="number"
                      placeholder="Add funds"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && topUpAmount) handleTopUp(topUpAmount);
                      }}
                    />
                    <button
                      className="topUpMiniBtn"
                      disabled={!topUpAmount}
                      onClick={() => handleTopUp(topUpAmount)}
                    >
                      Add
                    </button>
                  </div>
                  {[100000, 500000, 1000000].map((amt) => (
                    <button key={amt} className="topUpPresetBtn" onClick={() => handleTopUp(amt)}>
                      +{money(amt)}
                    </button>
                  ))}
                </div>
                <div className="profileDropdownFooter">
                  <Link to="/profile" className="profileViewLink" onClick={() => setShowProfile(false)}>
                    View full profile →
                  </Link>
                  <button className="resetMiniBtn" onClick={resetDemo}>
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
