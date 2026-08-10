import { useState, useRef, useEffect } from "react";
import { NavLink, Link, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Avatar from "../Avatar";
import OnboardingModal from "../OnboardingModal";
import DashboardHome from "../../pages/dashboard/DashboardHome";
import Discover from "../../pages/dashboard/Discover";
import PropertyDetail from "../../pages/dashboard/PropertyDetail";
import Portfolio from "../../pages/dashboard/Portfolio";
import Profile from "../../pages/dashboard/Profile";
import Notifications from "../../pages/dashboard/Notifications";

const NAV = [
  { to: "/dashboard", icon: "◈", label: "Dashboard" },
  { to: "/discover", icon: "◎", label: "Discover" },
  { to: "/ledger", icon: "▤", label: "My Ledger" },
  { to: "/notifications", icon: "◆", label: "Notifications" },
  { to: "/profile", icon: "●", label: "Profile" },
];

function Sidebar({ user, unread }) {
  const navCls = ({ isActive }) => "dNavItem" + (isActive ? " dNavItemActive" : "");
  return (
    <aside className="dSidebar">
      <Link to="/" className="dBrand">
        <img src="/logo/logo.png" alt="Flux" className="dLogo" />
        <span>Flux</span>
      </Link>
      <div className="dNavSection">Overview</div>
      <nav className="dNav">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === "/dashboard"} className={navCls}>
            <span className="dNavIcon">{n.icon}</span>
            {n.label}
            {n.to === "/notifications" && unread > 0 && (
              <span className="dNavBadge">{unread}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="dSidebarFoot">
        <Avatar name={user?.name} size="sm" />
        <div className="dSidebarMeta">
          <div className="dSidebarName">{user?.name}</div>
          <div className="dSidebarRole">PRO Investor</div>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const { user, theme, toggleTheme, unreadNotifications, logout, pendingRequests } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSearch = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    if (location.pathname !== "/discover") {
      navigate(`/discover?${next.toString()}`);
    } else {
      setSearchParams(next, { replace: true });
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="dTopbar">
      <div className="dTopbarLeft">
        <div className="dSearch">
          <span className="searchIcon">⌕</span>
          <input
            placeholder="Search properties, cities, yields..."
            value={searchParams.get("q") || ""}
            onChange={(e) => onSearch(e.target.value)}
          />
          <span className="dKbd">⌘K</span>
        </div>
      </div>
      <div className="dTopbarRight">
        {pendingRequests.length > 0 && (
          <Link to="/ledger" className="dStatusPill" title={`${pendingRequests.length} pending request(s)`}>
            <span className="dStatusDot" /> {pendingRequests.length} pending
          </Link>
        )}
        <label className="switch" title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          <input type="checkbox" checked={theme === "light"} onChange={toggleTheme} />
          <span className="switchTrack" />
        </label>
        <Link to="/notifications" className="dBell" title="Notifications">
          <span>◇</span>
          {unreadNotifications > 0 && <span className="dBellDot">{unreadNotifications}</span>}
        </Link>
        <div className="dProfileWrap" ref={menuRef}>
          <button className="dAvatarBtn" onClick={() => setMenuOpen((v) => !v)}>
            <Avatar name={user?.name} size="sm" />
            <span className="dCaret">▾</span>
          </button>
          {menuOpen && (
            <div className="dDropdown">
              <div className="dDropdownHead">
                <Avatar name={user?.name} size="md" />
                <div>
                  <div className="dDropdownName">{user?.name}</div>
                  <div className="dDropdownEmail">{user?.email}</div>
                </div>
              </div>
              <Link to="/profile" className="dDropdownItem" onClick={() => setMenuOpen(false)}>
                Profile &amp; settings
              </Link>
              <Link to="/discover" className="dDropdownItem" onClick={() => setMenuOpen(false)}>
                Discover assets
              </Link>
              <button className="dDropdownItem dDropdownDanger" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const { unreadNotifications } = useApp();
  const cls = ({ isActive }) => "dMTab" + (isActive ? " dMTabActive" : "");
  return (
    <nav className="dMobileNav">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.to === "/dashboard"} className={cls}>
          <span className="dMIcon">
            {n.icon}
            {n.to === "/notifications" && unreadNotifications > 0 && (
              <span className="dMBadge">{unreadNotifications}</span>
            )}
          </span>
          {n.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function UserLayout() {
  const { user, unreadNotifications, onboardingOpen } = useApp();

  return (
    <div className="dShell">
      <Sidebar user={user} unread={unreadNotifications} />
      <div className="dMain">
        <Topbar />
        <main className="dContent">
          <Routes>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/ledger" element={<Portfolio />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
      {onboardingOpen && <OnboardingModal />}
    </div>
  );
}
