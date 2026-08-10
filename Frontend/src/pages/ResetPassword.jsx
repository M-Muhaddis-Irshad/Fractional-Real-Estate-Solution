import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";

export default function ResetPassword() {
  const { theme, toggleTheme } = useApp();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
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
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authBg" aria-hidden="true" />
      <div className="authCard">
        <div className="authBrand">
          <img src="/logo/logo.png" alt="Flux" className="authLogo" />
          <span>Flux</span>
        </div>

        {!token ? (
          <>
            <h2 className="authAdminTitle" style={{ fontSize: 18, marginBottom: 6 }}>
              Invalid reset link
            </h2>
            <p className="authAdminSub" style={{ color: "var(--muted)", marginBottom: 20 }}>
              This link is missing its security token. It may be copied incorrectly
              or truncated.
            </p>
            <div className="authBack">
              <Link to="/forgot-password">← Request a new reset link</Link>
            </div>
          </>
        ) : done ? (
          <>
            <div className="pdReceiptIcon">✓</div>
            <div className="pdReceiptTitle">Password updated</div>
            <p className="pdReceiptSub" style={{ textAlign: "center" }}>
              Your password has been changed. You can now sign in with your new password.
            </p>
            <div className="authBack">
              <Link to="/login">← Back to sign in</Link>
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

              <button
                className="btn btnPrimary btnBlock btnLg"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Updating…" : "Update password"}
              </button>
            </form>

            <div className="authBack">
              <Link to="/login">← Back to sign in</Link>
            </div>
          </>
        )}
      </div>

      <button className="authThemeBtn" onClick={toggleTheme}>
        {theme === "dark" ? "☀ Light mode" : "☾ Dark mode"}
      </button>
    </div>
  );
}
