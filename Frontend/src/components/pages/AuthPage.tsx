"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { API_BASE } from "@/lib/api";
import AuthSideStats from "@/components/AuthSideStats";
import TermsModal from "@/components/TermsModal";
import PrivacyModal from "@/components/PrivacyModal";

// Admin access has no separate tab — a superadmin signs in with their regular
// credentials and is auto-detected + redirected to the admin panel.
const MODES = [
  { key: "login", label: "Sign in" },
  { key: "register", label: "Create account" },
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
  const { login, register, theme, toggleTheme } = useApp();
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
  const [mounted, setMounted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      const result =
        mode === "login" ? await login(form.email, form.password) : await register(form);
      if (result?.ok) {
        // Superadmins are detected from their credentials and sent to the panel.
        const dest =
          result.user?.role === "superadmin"
            ? "/admin"
            : next && next.startsWith("/")
              ? next
              : "/dashboard";
        router.replace(dest);
      }
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
              <span className="authDot" /> Fractional real-estate investing
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

          <div className="authTabs">
            {MODES.map((m) => (
              <button
                key={m.key}
                className={"authTab" + (mode === m.key ? " authTabActive" : "")}
                onClick={() => switchMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {googleError && <div className="errorText authGoogleError">{googleError}</div>}

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
                  I accept the{" "}
                  <button
                    type="button"
                    className="authTermsLink"
                    onClick={(e) => {
                      // View-only: open the terms modal without toggling the checkbox.
                      e.preventDefault();
                      e.stopPropagation();
                      setTermsOpen(true);
                    }}
                  >
                    Terms &amp; Conditions
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="authTermsLink"
                    onClick={(e) => {
                      // View-only: open the privacy modal without toggling the checkbox.
                      e.preventDefault();
                      e.stopPropagation();
                      setPrivacyOpen(true);
                    }}
                  >
                    Privacy Policy
                  </button>{" "}
                  and understand that no real transactions occur.
                </span>
              </label>
            )}

            {mode !== "register" && (
              <div className="authForgotRow">
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            )}

            {error && <div className="errorText">{error}</div>}

          <button className="btn btnGold btnBlock btnLg" type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
          </form>

          <div className="authBack">
            <Link href="/">
              <ArrowLeft size={13} /> Back to homepage
            </Link>
          </div>
        </div>
      </main>

      <button className="authThemeBtn" onClick={toggleTheme}>
        {mounted && (theme === "dark" ? <><Sun size={14} /> Light mode</> : <><Moon size={14} /> Dark mode</>)}
      </button>

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
}
