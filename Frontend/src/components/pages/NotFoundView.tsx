"use client";

import Link from "next/link";
import { MapPinOff } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { useApp } from "@/context/AppContext";

/**
 * Shared 404 view — rendered inside the appropriate layout shell depending on
 * the route group (public / admin / user). Each scope adjusts the chrome and
 * the "go back" link.
 */
export default function NotFoundView({ scope }: { scope: "public" | "admin" | "user" }) {
  const { user } = useApp();

  // --- Public layout ---
  if (scope === "public") {
    return (
      <div className="landingPage">
        <PublicNav user={user} links={[{ href: "/", label: "Home" }]} />
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "8rem 1.5rem 4rem", textAlign: "center" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <MapPinOff size={56} strokeWidth={1.5} style={{ color: "var(--brand)", opacity: 0.7 }} />
          </div>
          <h1 style={{ fontSize: "3.5rem", fontWeight: 800, fontFamily: "var(--font-display)", margin: 0 }}>
            404
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", margin: "0.75rem 0 2rem" }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/" className="btn btnGold" style={{ display: "inline-flex" }}>
            Back to homepage
          </Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // --- Admin / User layouts (renders inside their layout shell) ---
  const backHref = scope === "admin" ? "/admin" : "/dashboard";
  const backLabel = scope === "admin" ? "Back to overview" : "Back to dashboard";

  return (
    <div className="riseIn" style={{ textAlign: "center", padding: "5rem 1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <MapPinOff size={48} strokeWidth={1.5} style={{ color: "var(--brand)", opacity: 0.7 }} />
      </div>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, fontFamily: "var(--font-display)", margin: 0 }}>
        404
      </h1>
      <p style={{ fontSize: "1rem", color: "var(--muted)", margin: "0.75rem 0 2rem", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
        {scope === "admin"
          ? "This admin page doesn't exist. Check the sidebar for available sections."
          : "This page doesn't exist. Check the sidebar for available sections."}
      </p>
      <Link href={backHref} className="btn btnPrimary">
        {backLabel}
      </Link>
    </div>
  );
}
