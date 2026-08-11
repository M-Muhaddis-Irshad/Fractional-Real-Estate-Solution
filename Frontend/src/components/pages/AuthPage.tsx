"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

const MODES = [
  { key: "login", label: "Sign in" },
  { key: "register", label: "Create account" },
  { key: "admin", label: "Admin access" },
] as const;

type Mode = (typeof MODES)[number]["key"];

export default function AuthPage({ next }: { next?: string }) {
  const { login, adminLogin, register, theme, toggleTheme } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    acceptedTerms: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === "acceptedTerms" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }
    if (mode === "register") {
      if (!form.name.trim()) {
        setError("Full name is required.");
        return;
      }
      if (!form.acceptedTerms) {
        setError("You must accept the Terms & Conditions.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let result;
      if (mode === "admin") {
        result = await adminLogin(form.email, form.password);
        router.replace("/admin");
      } else if (mode === "login") {
        result = await login(form.email, form.password);
      } else {
        result = await register(form);
      }
      if (result?.ok && mode !== "admin") {
        const dest = next && next.startsWith("/") ? next : "/dashboard";
        router.replace(dest);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = mode === "admin";

  return (
    <div className="authPage">
      <div className="authBg" aria-hidden="true" />
      <div className={`authCard${isAdmin ? " authCardAdmin" : ""}`}>
        <div className="authBrand">
          <img src="/logo/logo.png" alt="Flux" className="authLogo" />
          <span>Flux</span>
        </div>

        {isAdmin && (
          <div className="authAdminBanner">
            <span className="authAdminIcon">◎</span>
            <div>
              <div className="authAdminTitle">Admin panel</div>
              <div className="authAdminSub">Restricted access. Platform administrators only.</div>
            </div>
          </div>
        )}

        <div className="authTabs">
          {MODES.map((m) => (
            <button
              key={m.key}
              className={
                "authTab" +
                (mode === m.key ? " authTabActive" : "") +
                (m.key === "admin" ? " authTabAdmin" : "")
              }
              onClick={() => switchMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="field">
              <span className="fieldLabel">Full name</span>
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Alex Vance"
                autoComplete="name"
              />
            </label>
          )}

          <label className="field">
            <span className="fieldLabel">Email</span>
            <input
              className="input"
              name="email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Password</span>
            <input
              className="input"
              name="password"
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {mode === "register" && (
            <label className="authCheck">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={set("acceptedTerms")}
              />
              <span>
                I accept the Terms &amp; Conditions and understand that no real transactions occur.
              </span>
            </label>
          )}

          {mode !== "register" && (
            <div className="authForgotRow">
              <Link href="/forgot-password">Forgot password?</Link>
            </div>
          )}

          {error && <div className="errorText">{error}</div>}

          <button className="btn btnPrimary btnBlock btnLg" type="submit" disabled={submitting}>
            {submitting
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : mode === "admin"
                  ? "Enter admin panel"
                  : "Create account"}
          </button>
        </form>

        <div className="authBack">
          <Link href="/">← Back to homepage</Link>
        </div>
      </div>

      <button className="authThemeBtn" onClick={toggleTheme}>
        {theme === "dark" ? "☀ Light mode" : "☾ Dark mode"}
      </button>
    </div>
  );
}
