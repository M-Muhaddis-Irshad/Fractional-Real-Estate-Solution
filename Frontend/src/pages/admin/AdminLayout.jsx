import { useState, useRef, useEffect } from "react";
import { NavLink, Link, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAdmin } from "../../context/AdminContext";
import Avatar from "../../components/Avatar";
import AdminDashboard from "./AdminDashboard";
import AdminProperties from "./AdminProperties";
import AdminPropertyForm from "./AdminPropertyForm";
import AdminFractional from "./AdminFractional";
import AdminUsers from "./AdminUsers";
import AdminInvestments from "./AdminInvestments";
import AdminFinancials from "./AdminFinancials";
import AdminContent from "./AdminContent";
import AdminNotifications from "./AdminNotifications";
import AdminSettings from "./AdminSettings";
import AdminLogs from "./AdminLogs";

const SECTIONS = [
  {
    title: "Management",
    items: [
      { to: "/admin", icon: "◈", label: "Overview", end: true },
      { to: "/admin/properties", icon: "▤", label: "Properties" },
      { to: "/admin/fractional", icon: "◇", label: "Fractional" },
      { to: "/admin/users", icon: "◎", label: "Users" },
      { to: "/admin/investments", icon: "◉", label: "Investments" },
      { to: "/admin/financials", icon: "▦", label: "Financials" },
    ],
  },
  {
    title: "Platform",
    items: [
      { to: "/admin/content", icon: "☰", label: "Content" },
      { to: "/admin/notifications", icon: "◆", label: "Notifications" },
      { to: "/admin/settings", icon: "⚙", label: "Settings" },
      { to: "/admin/logs", icon: "≡", label: "Logs" },
    ],
  },
];

function AdminSidebar({ pendingCount, onNavigate }) {
  const cls = ({ isActive }) => "aNavItem" + (isActive ? " aNavItemActive" : "");
  return (
    <aside className="aSidebar">
      <Link to="/" className="aBrand">
        <img src="/logo/logo.png" alt="Flux" className="aLogo" />
        <span>Flux <em>Admin</em></span>
      </Link>
      <div className="aSidebarInner">
        {SECTIONS.map((s) => (
          <div key={s.title} className="aNavGroup">
            <div className="aNavSection">{s.title}</div>
            {s.items.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={cls} onClick={onNavigate}>
                <span className="aNavIcon">{n.icon}</span>
                {n.label}
                {n.to === "/admin/investments" && pendingCount > 0 && (
                  <span className="aNavBadge">{pendingCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
      <div className="aSidebarFoot">
        <Link to="/" className="aFootLink">← Back to site</Link>
      </div>
    </aside>
  );
}

const TITLES = {
  "/admin": "Platform overview",
  "/admin/properties": "Properties",
  "/admin/properties/new": "List a property",
  "/admin/fractional": "Fractional offerings",
  "/admin/users": "Users",
  "/admin/investments": "Investments",
  "/admin/financials": "Financials",
  "/admin/content": "Content",
  "/admin/notifications": "Notifications",
  "/admin/settings": "Settings",
  "/admin/logs": "Logs",
};

function AdminTopbar({ onMenu }) {
  const { user, theme, toggleTheme, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const pageTitle = TITLES[location.pathname] || "Admin";

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="aTopbar">
      <div className="aTopbarLeft">
        <button className="aMenuBtn" onClick={onMenu} aria-label="Open menu">☰</button>
        <div className="aTopbarTitle">{pageTitle}</div>
      </div>
      <div className="aTopbarRight">
        <label className="switch" title="Toggle theme">
          <input type="checkbox" checked={theme === "light"} onChange={toggleTheme} />
          <span className="switchTrack" />
        </label>
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
              <button className="dDropdownItem" onClick={() => navigate("/admin/settings")}>
                Admin settings
              </button>
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

export default function AdminLayout() {
  const { pendingRequests } = useAdmin();
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="aShell">
      <div className={"aNavOverlay" + (navOpen ? " aNavOverlayOpen" : "")} onClick={() => setNavOpen(false)} />
      <div className={"aSidebarWrap" + (navOpen ? " aSidebarWrapOpen" : "")}>
        <AdminSidebar pendingCount={pendingRequests?.length} onNavigate={() => setNavOpen(false)} />
      </div>
      <div className="aMain">
        <AdminTopbar onMenu={() => setNavOpen(true)} />
        <main className="aContent">
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/properties" element={<AdminProperties />} />
            <Route path="/admin/properties/new" element={<AdminPropertyForm />} />
            <Route path="/admin/properties/:id/edit" element={<AdminPropertyForm />} />
            <Route path="/admin/fractional" element={<AdminFractional />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/investments" element={<AdminInvestments />} />
            <Route path="/admin/financials" element={<AdminFinancials />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
