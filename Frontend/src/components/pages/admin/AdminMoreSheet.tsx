"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Coins,
  FileText,
  PieChart,
  ScrollText,
  Settings,
  X,
} from "lucide-react";

const ITEMS = [
  { to: "/admin/fractional", icon: PieChart, label: "Fractional" },
  { to: "/admin/investments", icon: Coins, label: "Investments" },
  { to: "/admin/financials", icon: BarChart3, label: "Financials" },
  { to: "/admin/content", icon: FileText, label: "Content" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
  { to: "/admin/logs", icon: ScrollText, label: "Logs" },
];

function isActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(to + "/");
}

export default function AdminMoreSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Close on route change (Link navigation)
  useEffect(() => {
    if (open) onClose();
  }, [pathname]); // intentionally omit onClose to avoid loop

  return (
    <div
      className={"aSheetOverlay" + (open ? " aSheetOpen" : "")}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div className="aSheet" onClick={(e) => e.stopPropagation()}>
        <div className="aSheetHead">
          <span className="aSheetTitle">More sections</span>
          <button className="aSheetClose" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="aSheetBody">
          {ITEMS.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={
                "aSheetRow" +
                (isActive(pathname, item.to) ? " aSheetRowActive" : "")
              }
            >
              <span className="aSheetRowIcon">
                <item.icon size={17} />
              </span>
              <span className="aSheetRowLabel">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
