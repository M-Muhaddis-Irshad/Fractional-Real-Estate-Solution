"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import type { User } from "@/lib/types";

export interface NavLinkDef {
  href: string;
  label: string;
}

const scrollToFirst = (ids: string[]) => {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      return;
    }
  }
};

/**
 * PublicNav — sticky transparent nav used by the landing page and the
 * "Our Story" page. `links` is an array of { href: "#anchor" | "/path", label }.
 */
export default function PublicNav({
  user,
  links = [],
  onJoin,
}: {
  user?: User | null;
  links?: NavLinkDef[];
  onJoin?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY >= 1);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const close = () => setMenuOpen(false);
  const handleJoin = () => {
    close();
    if (onJoin) onJoin();
    else scrollToFirst(["properties", "cta"]);
  };
  const listProperty = () => {
    close();
    scrollToFirst(["properties", "cta"]);
  };

  const renderLink = (l: NavLinkDef, onNavigate?: () => void): ReactNode =>
    l.href.startsWith("#") ? (
      <a key={l.label} href={l.href} onClick={onNavigate}>
        {l.label}
      </a>
    ) : (
      <Link key={l.label} href={l.href} onClick={onNavigate}>
        {l.label}
      </Link>
    );

  return (
    <header className={"lnNav" + (scrolled ? " lnNavScrolled" : "")}>
      <div className="lnNavInner">
        <Link href="/" className="lnBrand" onClick={close} aria-label="Flux — home">
          <img src="/logo/logo.png" alt="" className="lnLogo" width={30} height={30} />
          <span>Flux</span>
        </Link>
        <nav className="lnLinks" aria-label="Primary">
          {links.map((l) => renderLink(l))}
        </nav>
        <div className="lnActions">
          <button
            className="lnThemeToggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          {user ? (
            <Link
              href={user.role === "superadmin" ? "/admin" : "/dashboard"}
              className="btn btnPrimary"
            >
              Open dashboard →
            </Link>
          ) : (
            <>
              <button className="btn btnGhost lnHideSm" onClick={listProperty}>
                List your property
              </button>
              <Link href="/login" className="btn btnGhost lnHideSm">
                Sign in
              </Link>
              <button className="btn btnPrimary" onClick={handleJoin}>
                Invest now
              </button>
            </>
          )}
          <button
            className={"lnBurger" + (menuOpen ? " lnBurgerOpen" : "")}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="lnMobileMenu" aria-label="Mobile">
          {links.map((l) => renderLink(l, close))}
          {user ? (
            <Link
              href={user.role === "superadmin" ? "/admin" : "/dashboard"}
              className="btn btnPrimary btnBlock"
              onClick={close}
            >
              Open dashboard →
            </Link>
          ) : (
            <div className="lnMobileActions">
              <Link href="/login" className="btn btnGhost btnBlock" onClick={close}>
                Sign in
              </Link>
              <button className="btn btnPrimary btnBlock" onClick={handleJoin}>
                Invest now
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
