"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Moon, Sun } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import AuthSideStats from "@/components/AuthSideStats";

export default function ResetPassword({ token }: { token?: string }) {
  const { theme, toggleTheme } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: { token, newPassword: password },
        auth: false,
      });
      setDone(true);
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
              <span className="authDot" /> Secure password reset
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

        {!token ? (
          <>
            <h2 className="authAdminTitle" style={{ fontSize: 18, marginBottom: 6 }}>
              Invalid reset link
            </h2>
            <p className="authAdminSub" style={{ color: "var(--muted)", marginBottom: 20 }}>
              This link is missing its security token. It may be copied incorrectly or truncated.
            </p>
            <div className="authBack">
              <Link href="/forgot-password">
                <ArrowLeft size={13} /> Request a new reset link
              </Link>
            </div>
          </>
        ) : done ? (
          <>
            <div className="pdReceiptIcon">
              <Check size={20} />
            </div>
            <div className="pdReceiptTitle">Password updated</div>
            <p className="pdReceiptSub" style={{ textAlign: "center" }}>
              Your password has been changed. You can now sign in with your new password.
            </p>
            <div className="authBack">
              <Link href="/login">
                <ArrowLeft size={13} /> Back to sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="authAdminTitle" style={{ fontSize: 18, marginBottom: 6 }}>
              Set a new password
            </h2>
            <p className="authAdminSub" style={{ color: "var(--muted)", marginBottom: 20 }}>
              Choose a new password for your account. Keep it at least 6 characters.
            </p>

            <form className="authForm" onSubmit={handleSubmit}>
              <label className="field">
                <span className="fieldLabel">New password</span>
                <input
                  className="input"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  autoFocus
                />
              </label>

              <label className="field">
                <span className="fieldLabel">Confirm new password</span>
                <input
                  className="input"
                  type="password"
                  name="confirmPassword"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </label>

              {error && <div className="errorText">{error}</div>}

              <button className="btn btnGold btnBlock btnLg" type="submit" disabled={submitting}>
                {submitting ? "Updating…" : "Update password"}
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
