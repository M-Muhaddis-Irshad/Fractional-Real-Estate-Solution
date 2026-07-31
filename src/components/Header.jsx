import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { money } from "../lib/format";
const LOGO = "/logo/logo.png";

export default function Header() {
  const { wallet, portfolioTotals, pendingRequests, topUpWallet, theme, toggleTheme, resetDemo } = useApp();
  const [showProfile, setShowProfile] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
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

  const onSearch = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    if (location.pathname !== "/") {
      navigate(`/?${next.toString()}`);
    } else {
      setSearchParams(next, { replace: true });
    }
  };

  const navCls = ({ isActive }) => "tabBtn" + (isActive ? " tabBtnActive" : "");
  const mNavCls = ({ isActive }) => "mTab" + (isActive ? " mTabActive" : "");

  return (
    <>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <img src={LOGO} alt="Flux" className="mark" />
          <span className="brandName">Flux</span>
        </Link>
        <nav className="sidebarNav">
          <div className="sidebarSection">Platform</div>
          <NavLink to="/" end className={navCls}>
            Discover
          </NavLink>
          <NavLink to="/portfolio" className={navCls}>
            My Ledger {portfolioTotals.count > 0 ? `(${portfolioTotals.count})` : ""}
          </NavLink>
          <NavLink to="/team" className={navCls}>
            Team {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ""}
          </NavLink>
          <NavLink to="/profile" className={navCls}>
            Profile
          </NavLink>
          <NavLink to="/list" className={navCls}>
            + List
          </NavLink>
        </nav>
        <div className="sidebarUser">
          <div className="avatarLetter">A</div>
          <div className="sidebarUserMeta">
            <div className="sidebarUserName">Alex Vance</div>
            <div className="sidebarUserRole">PRO Investor</div>
          </div>
        </div>
      </aside>

      <header className="topbar">
        <div className="topbarSearch">
          <span className="searchIcon">⌕</span>
          <input
            placeholder="Search by city, asset type or yield..."
            value={searchParams.get("q") || ""}
            onChange={(e) => onSearch(e.target.value)}
          />
          <span className="kbd">⌘K</span>
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
              <span className="avatarLetter">A</span>
              <span className="profileCaret">{showProfile ? "▲" : "▼"}</span>
            </button>
            {showProfile && (
              <div className="profileDropdown">
                <div className="profileDropdownHead">
                  <div className="avatarLarge">A</div>
                  <div>
                    <div className="profileDropdownName">Alex Vance</div>
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

      <nav className="mobileNav">
        <NavLink to="/" end className={mNavCls}>
          <span className="mIcon">◈</span>Discover
        </NavLink>
        <NavLink to="/portfolio" className={mNavCls}>
          <span className="mIcon">▤</span>Ledger
        </NavLink>
        <NavLink to="/team" className={mNavCls}>
          <span className="mIcon">◎</span>Team
        </NavLink>
        <NavLink to="/profile" className={mNavCls}>
          <span className="mIcon">●</span>Profile
        </NavLink>
        <NavLink to="/list" className={mNavCls}>
          <span className="mIcon">＋</span>List
        </NavLink>
      </nav>
    </>
  );
}
