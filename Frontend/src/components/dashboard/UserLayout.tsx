"use client";

import { useState, useRef, useEffect, Suspense, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Avatar from "@/components/Avatar";
import OnboardingModal from "@/components/OnboardingModal";
import LoadingScreen from "@/components/LoadingScreen";
import type { User } from "@/lib/types";

const NAV = [
  { to: "/dashboard", icon: "◈", label: "Dashboard" },
  { to: "/discover", icon: "◎", label: "Discover" },
  { to: "/ledger", icon: "▤", label: "My Ledger" },
  { to: "/notifications", icon: "◆", label: "Notifications" },
  { to: "/profile", icon: "●", label: "Profile" },
];

function isNavActive(pathname: string, to: string): boolean {
  if (to === "/dashboard") return pathname === "/dashboard";
  return pathname === to || pathname.startsWith(to + "/");
}

function Sidebar({ user, unread, pathname }: { user: User | null; unread: number; pathname: string }) {
  return (
    <aside className="dSidebar">
      <Link href="/" className="dBrand">
        <img src="/logo/logo.png" alt="Flux" className="dLogo" />
        <span>Flux</span>
      </Link>
      <div className="dNavSection">Overview</div>
      <nav className="dNav">
        {NAV.map((n) => (
          <Link
            key={n.to}
            href={n.to}
            className={"dNavItem" + (isNavActive(pathname, n.to) ? " dNavItemActive" : "")}
          >
            <span className="dNavIcon">{n.icon}</span>
            {n.label}
            {n.to === "/notifications" && unread > 0 && <span className="dNavBadge">{unread}</span>}
          </Link>
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
          <Link
            href="/ledger"
            className="dStatusPill"
            title={`${pendingRequests.length} pending request(s)`}
          >
            <span className="dStatusDot" /> {pendingRequests.length} pending
          </Link>
        )}
        <label className="switch" title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          <input type="checkbox" checked={theme === "light"} onChange={toggleTheme} />
          <span className="switchTrack" />
        </label>
        <Link href="/notifications" className="dBell" title="Notifications">
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
      {NAV.map((n) => (
        <Link
          key={n.to}
          href={n.to}
          className={"dMTab" + (isNavActive(pathname, n.to) ? " dMTabActive" : "")}
        >
          <span className="dMIcon">
            {n.icon}
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
      <Sidebar user={user} unread={unreadNotifications} pathname={pathname} />
      <div className="dMain">
        <Suspense fallback={null}>
          <Topbar />
        </Suspense>
        <main className="dContent">{children}</main>
        <MobileNav />
      </div>
      {onboardingOpen && <OnboardingModal />}
    </div>
  );
}
