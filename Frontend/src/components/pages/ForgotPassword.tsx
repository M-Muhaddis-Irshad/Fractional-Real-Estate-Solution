"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import AuthSideStats from "@/components/AuthSideStats";

export default function ForgotPassword() {
  const { theme, toggleTheme } = useApp();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: { email: value },
        auth: false,
      });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="authPage">
      {/* Left brand panel (split-screen, ref: UI/Auth/ref 1) */}
      <aside className="authSide">
        <div className="authSideInner">
          <div className="authSideBrand">
            <img src="/logo/logo.webp" alt="Flux" className="authSideLogo" />
            <span>Flux</span>
          </div>
          <div className="authSideBody">
            <div className="authSideKicker">
              <span className="authDot" /> Account recovery
            </div>
            <h1 className="authSideTitle">
              Own a fraction.
              <br />
              <em>Earn the whole return.</em>
            </h1>
            <p className="authSideSub">
              Access institutional-grade real estate through fractional ownership — secure,
              transparent, and built for the next generation of global investors.
            </p>
            <ul className="authSidePoints">
              <li>Assets vetted and underwritten by our real-estate team</li>
              <li>Rental income distributed automatically, every month</li>
              <li>Ownership recorded immutably, fully transparent</li>
            </ul>
          </div>
          <AuthSideStats />
        </div>
      </aside>

      <main className="authMain">
        <div className="authCard">
          <div className="authBrand">
            <img src="/logo/logo.webp" alt="Flux" className="authLogo" />
            <span>Flux</span>
          </div>

        {sent ? (
          <div>
            <div className="pdReceiptIcon">✉</div>
            <div className="pdReceiptTitle">Check your inbox</div>
            <p className="pdReceiptSub" style={{ textAlign: "center" }}>
              If an account exists for <strong>{email.trim()}</strong>, we&apos;ve sent a link to
              reset your password. It&apos;s valid for 1 hour.
              <br />
              <br />
              Didn&apos;t receive it? Check your spam folder, or try again in a few minutes.
            </p>
            <div className="authBack">
              <Link href="/login">
                <ArrowLeft size={13} /> Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h2 className="authAdminTitle" style={{ fontSize: 18, marginBottom: 6 }}>
              Forgot your password?
            </h2>
            <p className="authAdminSub" style={{ color: "var(--muted)", marginBottom: 20 }}>
              Enter the email you used to sign up and we&apos;ll send you a secure reset link.
            </p>

            <form className="authForm" onSubmit={handleSubmit}>
              <label className="field">
                <span className="fieldLabel">Email</span>
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </label>

              {error && <div className="errorText">{error}</div>}

              <button className="btn btnGold btnBlock btnLg" type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <div className="authBack">
              <Link href="/login">
                <ArrowLeft size={13} /> Back to sign in
              </Link>
            </div>
          </>
        )}
        </div>
      </main>

      <button className="authThemeBtn" onClick={toggleTheme}>
        {mounted && (theme === "dark" ? <><Sun size={14} /> Light mode</> : <><Moon size={14} /> Dark mode</>)}
      </button>
    </div>
  );
}
