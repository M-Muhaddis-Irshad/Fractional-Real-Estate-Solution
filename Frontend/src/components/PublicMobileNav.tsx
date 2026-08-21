"use client";

import { useRouter, usePathname } from "next/navigation";
import { Building2, BookOpen, HelpCircle, Home, Layers } from "lucide-react";
import type { NavLinkDef } from "@/components/PublicNav";

/* ------------------------------------------------------------------
   PublicMobileNav — bottom tab bar shown on public pages at ≤960px.

   The `links` prop mirrors the same NavLinkDef[] passed to PublicNav.
   Anchor links (#section) scroll if already on "/", otherwise navigate
   to "/#section". Route links navigate directly.
   ------------------------------------------------------------------ */

const TAB_ICONS: Record<string, typeof Home> = {
  "/": Home,
  "/our-story": BookOpen,
  "#properties": Building2,
  "#how": Layers,
  "#features": Layers,
  "#faq": HelpCircle,
};

/* Scroll to an element by id; returns true if found. */
function scrollToId(id: string): boolean {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
    return true;
  }
  return false;
}

export default function PublicMobileNav({ links }: { links: NavLinkDef[] }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTab = (href: string) => {
    if (href.startsWith("#")) {
      const anchorId = href.slice(1);
      if (pathname === "/") {
        /* Already on landing — scroll in-place. */
        scrollToId(anchorId);
      } else {
        /* Navigate to "/#section" then scroll after mount. */
        router.push(href);
        // Give Next.js a moment to mount the landing page, then scroll.
        setTimeout(() => scrollToId(anchorId), 150);
      }
    } else {
      router.push(href);
    }
  };

  return (
    <nav className="lnMobileNav" aria-label="Mobile">
      {links.map((l) => {
        const Icon = TAB_ICONS[l.href] || Home;
        /* Active: exact match for route links, or highlight if on "/" for anchors */
        const active = l.href.startsWith("#")
          ? pathname === "/"
          : pathname === l.href;
        return (
          <button
            key={l.href}
            className={"lnMTab" + (active ? " lnMTabActive" : "")}
            onClick={() => handleTab(l.href)}
            type="button"
          >
            <span className="lnMIcon">
              <Icon size={17} />
            </span>
            {l.label}
          </button>
        );
      })}
    </nav>
  );
}
