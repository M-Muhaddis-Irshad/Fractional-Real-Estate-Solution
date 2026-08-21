"use client";

import TermsContent from "@/components/TermsContent";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { useApp } from "@/context/AppContext";

/**
 * Standalone Terms & Conditions page — accessible at /terms so that Google
 * OAuth consent-screen links (and any other external references) resolve
 * correctly instead of 404-ing.
 */
export default function TermsPage() {
  const { user, platform } = useApp();
  const email = platform.supportEmail || "support@flux.app";
  const phone = platform.supportPhone;

  return (
    <div className="landingPage">
      <PublicNav user={user} links={[{ href: "/", label: "Home" }]} />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "6rem 1.5rem 4rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
          Last updated: August 2025
        </p>
        <TermsContent email={email} phone={phone} />
      </main>
      <PublicFooter />
    </div>
  );
}
