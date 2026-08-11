# Flux — Features & Benefits

**Question this document answers:** *What does THIS platform offer that typical fractional real estate platforms / competitors don't?*

Everything below is grounded in the actual codebase (verified against `server/src/routes`, `server/src/models`, `server/src/services/cryptoPayment.js`, and the Next.js frontend). No invented numbers — figures like the 2.25% fee and ~20s demo confirmation come straight from the code.

---

## Comparison table

| Feature | This Platform | Typical Competitors | Real user benefit |
|---|---|---|---|
| **1. Ownership request model** | Share purchases are submitted as requests (`PurchaseRequest` model: `pending → approved/rejected`) and can be gated behind a manual admin review toggle (`platform.requireApproval`); with the gate off, requests settle instantly through the same pipeline. | Instant-buy at checkout with no human review step and no audit trail. | Every purchase is recorded and traceable — investors always know the state of their request, and the team can catch issues before shares are sold. |
| **2. Fee transparency** | The team fee is a single platform setting (`Settings.teamFee`, **2.25% default**, admin-configurable 0–25%) that is computed **up-front at request creation** (`teamFeePct` + `teamFeeAmount` stored on the request) and shown on the investor receipt, portfolio rows, and admin financials. | Fees hidden in the spread or in dense legal terms, discovered only at checkout. | Investors see exactly what they pay — the fee breakdown is visible **before** they commit. |
| **3. Crypto payment support** | Coinbase Commerce integration with **BTC / ETH / USDC / USDT** (live API + signed HMAC-SHA256 webhooks, fail-closed) alongside a simulated demo mode that auto-confirms in ~20s so the whole flow is testable. | Card/bank transfer only, or crypto bolted on without a tested settlement path. | Investors can pay in stablecoins or BTC/ETH today — and the settlement pipeline (shares + token) is identical for fiat and crypto. |
| **4. Multi-auth options** | Role-based JWT auth with an **account approval workflow** (pending / active / rejected / suspended) and separate investor vs super-admin surfaces. *(Google/Apple OAuth is planned, not yet shipped.)* | Email/password only, or social-only with no role model. | A single secure login model with explicit admin-vetted account status — clear who can invest and who runs the platform. |
| **5. Investor Portfolio vs Team Console** | Two deliberately separate interfaces: the investor side (Dashboard, Discover, Ledger/Portfolio, property detail) and the internal admin console (users, requests, financials, content, notifications, settings, logs, token explorer). | One customer-facing UI; operations handled in spreadsheets or a bolted-on admin page. | Ops work (approvals, fee config, announcements) never leaks into the investor experience — cleaner for both sides. |
| **6. Onboarding UX** | A 5-slide guided carousel on first login (welcome → how it works → benefits → flow → CTA) with keyboard/swipe/dots navigation; completion is persisted per account (`hasSeenOnboarding` in MongoDB) so it never nags again. | No onboarding, or a static "welcome" card. | New investors learn the request → approval → token flow in ~30 seconds instead of guessing. |
| **7. Fund-handling transparency** | Request lifecycle is fully explicit: **pending** on submission (fee locked in at creation) → **shares allocated + ownership token minted + fee accrued** on approval → **request voided with no charge** on rejection. No money moves silently at any step. | Funds are charged immediately at checkout; refunds are slow and opaque. | Investors are never charged for a rejected or unconfirmed purchase — the request record is the single source of truth. |

---

## Honest section — not yet differentiated / still MVP-level

These are real gaps found in the codebase (not marketing spin):

- **No Google/Apple OAuth yet** — auth is email/password + JWT only; the task brief's "Google + Apple" is a **planned** item, not implemented. Apple Sign In also requires an Apple Developer account.
- **Crypto is live-ready but demo by default** — `COINBASE_COMMERCE_API_KEY` and the webhook secret are unset in dev, so payments run in simulated mode (`demo_*` charge ids, auto-confirm ~20s). Real charges + verified webhooks need production keys.
- **No fiat payment gateway** — approval "settles" the record (shares + token + fee) but **no real money movement is wired** (no Stripe/checkout provider). Good for a demo, not for real deposits.
- **Share supply is admin-entered data** — `totalShares`/`soldShares` are set by the team (and seeded demo values); there's no external cap-table or issuer-verified share registry. The atomic oversell guard protects the math, not the source of the supply.
- **Flux Chain is an internal ledger, not a public blockchain** — tokens are hash-linked blocks in MongoDB (genesis + mint, SHA-256, PoW-style difficulty, `verifyChain` endpoint). Verifiable internally, but not on a public network.
- **No KYC/AML, no legal entity, placeholder terms** — `termsVersion: "1.0"` is a default; compliance review hasn't happened.
- **No unit/integration tests** — typecheck, lint and build pass, but there's no automated test suite yet.
- **Secondary-market liquidity is aspirational** — the onboarding copy mentions "liquidity through our secondary market," but no sell-side/secondary trading is implemented.
