import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";

export default function ForgotPassword() {
  const { theme, toggleTheme } = useApp();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
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

        {sent ? (
          <div>
            <div className="pdReceiptIcon">✉</div>
            <div className="pdReceiptTitle">Check your inbox</div>
            <p className="pdReceiptSub" style={{ textAlign: "center" }}>
              If an account exists for <strong>{email.trim()}</strong>, we've sent
              a link to reset your password. It's valid for 1 hour.
              <br />
              <br />
              Didn't receive it? Check your spam folder, or try again in a few minutes.
            </p>
            <div className="authBack">
              <Link to="/login">← Back to sign in</Link>
            </div>
          </div>
        ) : (
          <>
            <h2 className="authAdminTitle" style={{ fontSize: 18, marginBottom: 6 }}>
              Forgot your password?
            </h2>
            <p className="authAdminSub" style={{ color: "var(--muted)", marginBottom: 20 }}>
              Enter the email you used to sign up and we'll send you a secure reset link.
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

              <button
                className="btn btnPrimary btnBlock btnLg"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send reset link"}
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
