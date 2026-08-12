"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { API_BASE } from "@/lib/api";

const MODES = [
  { key: "login", label: "Sign in" },
  { key: "register", label: "Create account" },
  { key: "admin", label: "Admin access" },
] as const;

type Mode = (typeof MODES)[number]["key"];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function AuthPage({
  next,
  googleError,
}: {
  next?: string;
  googleError?: string;
}) {
  const { login, adminLogin, register, theme, toggleTheme } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    acceptedTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
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
    setShowPassword(false);
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

        {googleError && <div className="errorText authGoogleError">{googleError}</div>}

        {!isAdmin && (
          <>
            <a
              className="btn btnGhost btnBlock btnLg authGoogleBtn"
              href={`${API_BASE}/api/auth/google`}
            >
              <GoogleIcon />
              Continue with Google
            </a>
            <div className="authDivider">
              <span>or sign in with email</span>
            </div>
          </>
        )}

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
            <div className="pwWrap">
              <input
                className="input"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="pwToggle"
                onClick={() => setShowPassword((s) => !s)}
                onMouseDown={(e) => e.preventDefault()}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
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
