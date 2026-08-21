"use client";

import { useState, useRef, useEffect, Suspense, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Compass,
  LayoutDashboard,
  Menu,
  Plus,
  Receipt,
  Search,
  Settings,
  User as UserIcon,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import OnboardingModal from "@/components/OnboardingModal";
import LoadingScreen from "@/components/LoadingScreen";
import type { User } from "@/lib/types";

const SIDEBAR_NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/discover", icon: Compass, label: "Discover" },
  { to: "/ledger", icon: Receipt, label: "My Ledger" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/profile", icon: UserIcon, label: "Profile" },
];

const MOBILE_NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/discover", icon: Compass, label: "Discover" },
  { to: "/ledger", icon: Receipt, label: "Ledger" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/account", icon: UserIcon, label: "Account" },
];

function isNavActive(pathname: string, to: string): boolean {
  if (to === "/dashboard") return pathname === "/dashboard";
  return pathname === to || pathname.startsWith(to + "/");
}

function Sidebar({
  user,
  unread,
  pathname,
  onClose,
}: {
  user: User | null;
  unread: number;
  pathname: string;
  onClose: () => void;
}) {
  return (
    <aside className="dSidebar">
      <button className="dSidebarClose" onClick={onClose} aria-label="Close sidebar" title="Close sidebar">
        <X size={16} />
      </button>
      <Link href="/" className="dBrand">
        <img src="/logo/logo.webp" alt="Flux" className="dLogo" />
        <span>Flux</span>
      </Link>
      <div className="dNavSection">Overview</div>
      <nav className="dNav">
        {SIDEBAR_NAV.map((n) => (
          <Link
            key={n.to}
            href={n.to}
            className={"dNavItem" + (isNavActive(pathname, n.to) ? " dNavItemActive" : "")}
          >
            <span className="dNavIcon">
              <n.icon size={16} />
            </span>
            {n.label}
            {n.to === "/notifications" && unread > 0 && <span className="dNavBadge">{unread}</span>}
          </Link>
        ))}
      </nav>
      <div className="dSidebarFoot">
        <Avatar name={user?.name} src={user?.avatar} size="sm" />
        <div className="dSidebarMeta">
          <div className="dSidebarName">{user?.name}</div>
          <div className="dSidebarRole">{user?.role === "superadmin" ? "Administrator" : "Pro Investor"}</div>
        </div>
        <Link href="/profile" className="dSidebarGear" title="Settings" aria-label="Settings">
          <Settings size={16} />
        </Link>
      </div>
    </aside>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, theme, toggleTheme, unreadNotifications, logout, pendingRequests } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onSearch = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    const qs = next.toString();
    if (pathname !== "/discover") {
      router.push(`/discover${qs ? `?${qs}` : ""}`);
    } else {
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  };

  const handleSignOut = () => {
    logout();
    router.replace("/");
  };

  return (
    <header className="dTopbar">
      <button className="dMenuBtn" onClick={onMenu} aria-label="Toggle sidebar" title="Toggle sidebar">
        <Menu size={18} />
      </button>
      <div className="dTopbarLeft">
        <div className="dSearch">
          <span className="searchIcon">
            <Search size={14} />
          </span>
          <input
            placeholder="Search properties, cities, yields..."
            value={searchParams.get("q") || ""}
            onChange={(e) => onSearch(e.target.value)}
          />
          <span className="dKbd">⌘K</span>
        </div>
      </div>
      <div className="dTopbarRight">
        <Link href="/discover" className="btn btnGold dInvestBtn">
          <Plus size={15} />
          Explore assets
        </Link>
        {pendingRequests.length > 0 && (
          <Link
            href="/ledger"
            className="dStatusPill"
            title={`${pendingRequests.length} pending request(s)`}
          >
            <span className="dStatusDot" /> {pendingRequests.length} pending
          </Link>
        )}
        <label className="switch switchTheme" title={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Toggle theme"}>
          <input type="checkbox" checked={mounted && theme === "light"} onChange={toggleTheme} />
          <span className="switchTrack" />
        </label>
        <Link href="/notifications" className="dBell" title="Notifications">
          <Bell size={17} />
          {unreadNotifications > 0 && <span className="dBellDot">{unreadNotifications}</span>}
        </Link>
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
              <Link href="/profile" className="dDropdownItem" onClick={() => setMenuOpen(false)}>
                Profile &amp; settings
              </Link>
              <Link href="/discover" className="dDropdownItem" onClick={() => setMenuOpen(false)}>
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
  const pathname = usePathname();
  return (
    <nav className="dMobileNav">
      {MOBILE_NAV.map((n) => (
        <Link
          key={n.to}
          href={n.to}
          className={"dMTab" + (isNavActive(pathname, n.to) ? " dMTabActive" : "")}
        >
          <span className="dMIcon">
            <n.icon size={17} />
            {n.to === "/notifications" && unreadNotifications > 0 && (
              <span className="dMBadge">{unreadNotifications}</span>
            )}
          </span>
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

export default function UserLayout({ children }: { children: ReactNode }) {
  const { user, authChecked, initialized, unreadNotifications, onboardingOpen } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Route guards — mirrors the old RequireUser + role redirects.
  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      const next = encodeURIComponent(pathname + window.location.search);
      router.replace(`/login?next=${next}`);
    } else if (user.role === "superadmin") {
      router.replace("/admin");
    }
  }, [authChecked, user, pathname, router]);

  if (!authChecked || (user && !initialized)) return <LoadingScreen />;
  if (!user || user.role === "superadmin") return <LoadingScreen />;

  return (
    <div className="dShell">
      <div className={"dSidebarWrap" + (sidebarOpen ? "" : " dSidebarWrapCollapsed")}>
        <Sidebar
          user={user}
          unread={unreadNotifications}
          pathname={pathname}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      <div className="dMain">
        <Suspense fallback={null}>
          <Topbar onMenu={() => setSidebarOpen((v) => !v)} />
        </Suspense>
        <main className="dContent">{children}</main>
        <MobileNav />
      </div>
      {onboardingOpen && <OnboardingModal />}
    </div>
  );
}
