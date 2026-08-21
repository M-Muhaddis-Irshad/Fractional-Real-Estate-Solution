"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Menu,
  Megaphone,
  Users,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import AdminMoreSheet from "./AdminMoreSheet";

const TABS = [
  { to: "/admin", icon: LayoutDashboard, label: "Home" },
  { to: "/admin/properties", icon: Building2, label: "Properties" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/notifications", icon: Megaphone, label: "Notify" },
];

function isActive(pathname: string, to: string): boolean {
  if (to === "/admin") return pathname === "/admin";
  return pathname === to || pathname.startsWith(to + "/");
}

export default function AdminMobileNav() {
  const pathname = usePathname();
  const { requests } = useAdmin();
  const [moreOpen, setMoreOpen] = useState(false);
  const pendingCount = (requests || []).filter((r) => r.status === "pending").length;

  return (
    <>
      <nav className="aMobileNav">
        {TABS.map((t) => (
          <Link
            key={t.to}
            href={t.to}
            className={"aMTab" + (isActive(pathname, t.to) ? " aMTabActive" : "")}
          >
            <span className="aMIcon">
              <t.icon size={17} />
              {t.to === "/admin/notifications" && pendingCount > 0 && (
                <span className="aMBadge">{pendingCount}</span>
              )}
            </span>
            {t.label}
          </Link>
        ))}
        <button
          className={"aMTab" + (moreOpen ? " aMTabActive" : "")}
          onClick={() => setMoreOpen(true)}
          type="button"
        >
          <span className="aMIcon">
            <Menu size={17} />
          </span>
          More
        </button>
      </nav>
      <AdminMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
