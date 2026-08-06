import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

const MODES = [
  { key: "login", label: "Sign in" },
  { key: "register", label: "Create account" },
  { key: "admin", label: "Admin access" },
];

export default function AuthPage() {
  const { login, adminLogin, register, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    acceptedTerms: false,
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => {
    const value = field === "acceptedTerms" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  };

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e) => {
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
        navigate("/admin", { replace: true });
      } else if (mode === "login") {
        result = await login(form.email, form.password);
      } else {
        result = await register(form);
      }
      if (result?.ok && mode !== "admin") {
        const next = searchParams.get("next");
        const dest = next && next.startsWith("/") ? next : "/dashboard";
        navigate(dest, { replace: true });
      }
    } catch (err) {
      setError(err.message);
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
              className={"authTab" + (mode === m.key ? " authTabActive" : "") + (m.key === "admin" ? " authTabAdmin" : "")}
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

        <div className="authHint">
          <div className="authHintTitle">
            {isAdmin ? "Admin demo account" : "Demo accounts"}
          </div>
          {isAdmin ? (
            <div className="authHintRow">Admin — muhaddisirshad58@gmail.com / fluxx@@</div>
          ) : (
            <>
              <div className="authHintRow">Investor — alex.vance@example.com / demo1234</div>
              <div className="authHintRow">
                Admin — muhaddisirshad58@gmail.com / fluxx@@{" "}
                <button className="authHintLink" onClick={() => switchMode("admin")}>
                  (use Admin access)
                </button>
              </div>
            </>
          )}
        </div>

        <div className="authBack">
          <Link to="/">← Back to homepage</Link>
        </div>
      </div>

      <button className="authThemeBtn" onClick={toggleTheme}>
        {theme === "dark" ? "☀ Light mode" : "☾ Dark mode"}
      </button>
    </div>
  );
}
