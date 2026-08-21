"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  Coins,
  FileText,
  LayoutDashboard,
  Megaphone,
  Menu,
  PieChart,
  ScrollText,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAdmin } from "@/context/AdminContext";
import Avatar from "@/components/Avatar";
import LoadingScreen from "@/components/LoadingScreen";
import AdminMobileNav from "@/components/pages/admin/AdminMobileNav";

const SECTIONS = [
  {
    title: "Management",
    items: [
      { to: "/admin", icon: LayoutDashboard, label: "Overview" },
      { to: "/admin/properties", icon: Building2, label: "Properties" },
      { to: "/admin/fractional", icon: PieChart, label: "Fractional" },
      { to: "/admin/users", icon: Users, label: "Users" },
      { to: "/admin/investments", icon: Coins, label: "Investments" },
      { to: "/admin/financials", icon: BarChart3, label: "Financials" },
    ],
  },
  {
    title: "Platform",
    items: [
      { to: "/admin/content", icon: FileText, label: "Content" },
      { to: "/admin/notifications", icon: Megaphone, label: "Notifications" },
      { to: "/admin/settings", icon: Settings, label: "Settings" },
      { to: "/admin/logs", icon: ScrollText, label: "Logs" },
    ],
  },
];

function isAdminActive(pathname: string, to: string): boolean {
  if (to === "/admin") return pathname === "/admin";
  return pathname === to || pathname.startsWith(to + "/");
}

function AdminSidebar({
  pendingCount,
  pathname,
  onNavigate,
  onClose,
}: {
  pendingCount: number;
  pathname: string;
  onNavigate?: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="aSidebar">
      <button className="aSidebarClose" onClick={onClose} aria-label="Close sidebar" title="Close sidebar">
        <X size={16} />
      </button>
      <Link href="/" className="aBrand">
        <img src="/logo/logo.webp" alt="Flux" className="aLogo" />
        <span>
          Flux <em>Admin</em>
        </span>
      </Link>
      <div className="aSidebarInner">
        {SECTIONS.map((s) => (
          <div key={s.title} className="aNavGroup">
            <div className="aNavSection">{s.title}</div>
            {s.items.map((n) => (
              <Link
                key={n.to}
                href={n.to}
                className={"aNavItem" + (isAdminActive(pathname, n.to) ? " aNavItemActive" : "")}
                onClick={onNavigate}
              >
                <span className="aNavIcon">
                  <n.icon size={16} />
                </span>
                {n.label}
                {n.to === "/admin/investments" && pendingCount > 0 && (
                  <span className="aNavBadge">{pendingCount}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="aSidebarFoot">
        <Link href="/" className="aFootLink">
          <ArrowLeft size={13} /> Back to site
        </Link>
      </div>
    </aside>
  );
}

const TITLES: Record<string, string> = {
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

function AdminTopbar({ onMenu }: { onMenu: () => void }) {
  const { user, theme, toggleTheme, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const pageTitle =
    TITLES[pathname] ||
    (pathname.startsWith("/admin/properties/") && pathname.endsWith("/edit")
      ? "Edit property"
      : "Admin");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSignOut = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="aTopbar">
      <div className="aTopbarLeft">
        <button className="aMenuBtn" onClick={onMenu} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <div className="aTopbarTitle">{pageTitle}</div>
      </div>
      <div className="aTopbarRight">
        <label className="switch switchTheme" title="Toggle theme">
          <input type="checkbox" checked={theme === "light"} onChange={toggleTheme} />
          <span className="switchTrack" />
        </label>
        <div className="dProfileWrap" ref={menuRef}>
          <button className="dAvatarBtn" onClick={() => setMenuOpen((v) => !v)}>
            <Avatar name={user?.name} src={user?.avatar} size="sm" />
            <span className="dCaret">
              <ChevronDown size={14} />
            </span>
          </button>
          {menuOpen && (
            <div className="dDropdown">
              <div className="dDropdownHead">
                <Avatar name={user?.name} src={user?.avatar} size="md" />
                <div>
                  <div className="dDropdownName">{user?.name}</div>
                  <div className="dDropdownEmail">{user?.email}</div>
                </div>
              </div>
              <button className="dDropdownItem" onClick={() => router.push("/admin/settings")}>
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

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { requests } = useAdmin();
  const { user, authChecked, initialized } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const pendingRequests = (requests || []).filter((r) => r.status === "pending");
  const [navOpen, setNavOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop collapse

  // Route guards — mirrors the old RequireAdmin logic.
  useEffect(() => {
    if (!authChecked) return;
    if (!user) router.replace("/login");
    else if (user.role !== "superadmin") router.replace("/");
  }, [authChecked, user, router]);

  if (!authChecked || (user && !initialized)) return <LoadingScreen />;
  if (!user || user.role !== "superadmin") return <LoadingScreen />;

  const openSidebar = () => {
    setCollapsed(false);
    setNavOpen(true);
  };
  const closeSidebar = () => {
    setCollapsed(true);
    setNavOpen(false);
  };

  return (
    <div className="aShell">
      <div
        className={"aNavOverlay" + (navOpen ? " aNavOverlayOpen" : "")}
        onClick={closeSidebar}
      />
      <div
        className={
          "aSidebarWrap" +
          (navOpen ? " aSidebarWrapOpen" : "") +
          (collapsed ? " aSidebarWrapCollapsed" : "")
        }
      >
        <AdminSidebar
          pendingCount={pendingRequests.length}
          pathname={pathname}
          onNavigate={() => setNavOpen(false)}
          onClose={closeSidebar}
        />
      </div>
      <div className="aMain">
        <AdminTopbar onMenu={openSidebar} />
        <main className="aContent">{children}</main>
        <AdminMobileNav />
      </div>
    </div>
  );
}
