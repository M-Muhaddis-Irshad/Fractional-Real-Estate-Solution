"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Moon, Sun } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useApp();

  useEffect(() => {
    // Fires only on the client, after hydration. Until this is true the theme
    // toggle renders a neutral label so server markup and client markup match
    // (the real theme lives in localStorage, which the server can't see).
    setMounted(true);
  }, []);

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
          <img src="/logo/logo.webp" alt="" className="lnLogo" width={30} height={30} />
          <span>Flux</span>
        </Link>
        <nav className="lnLinks" aria-label="Primary">
          {links.map((l) => renderLink(l))}
        </nav>
        <div className="lnActions">
          <button
            className="lnThemeToggle"
            onClick={toggleTheme}
            aria-label={
              !mounted
                ? "Toggle theme"
                : theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
            }
          >
            {mounted && (theme === "dark" ? <Sun size={16} /> : <Moon size={16} />)}
          </button>
          {user ? (
            <Link
              href={user.role === "superadmin" ? "/admin" : "/dashboard"}
              className="btn btnGold"
            >
              Open dashboard
              <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btnGhost lnHideSm">
                Sign in
              </Link>
              <button className="btn btnGold" onClick={handleJoin}>
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
              className="btn btnGold btnBlock"
              onClick={close}
            >
              Open dashboard
              <ArrowRight size={15} />
            </Link>
          ) : (
            <div className="lnMobileActions">
              <Link href="/login" className="btn btnGhost btnBlock" onClick={close}>
                Sign in
              </Link>
              <button className="btn btnGold btnBlock" onClick={handleJoin}>
                Invest now
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
