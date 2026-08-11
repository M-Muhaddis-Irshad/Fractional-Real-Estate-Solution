# Flux — Session Summary

> **Platform:** Fractional real estate investment · **Stack:** Next.js (App Router) + TypeScript frontend, Node/Express + MongoDB backend

## Ab tak kya bana hai
Flux ek fractional real estate platform hai — log chhoti raqam mein property ke shares kharid sakte hain. Frontend aur backend dono tayyar hain: signup/login, property listings, share kharidne ka request flow, team fee ka hisaab, crypto payment ka demo, aur poora admin panel kaam kar raha hai.

## Key features implemented
- **Login/signup** — JWT-based, investor aur admin alag roles, account approve/reject system
- **Property listings** — admin review karta hai (approve/reject/feature), invest open/close toggle
- **Share requests** — pending → approved/rejected; auto mode mein instant settle bhi hota hai
- **Team fee** — 2.25% default, request par pehle se dikhta hai, admin change kar sakta hai
- **Flux Chain tokens** — har purchase par ownership token mint hota hai (hash-linked ledger)
- **Crypto payments** — Coinbase Commerce (BTC/ETH/USDC/USDT); demo mode ~20 sec mein confirm
- **Onboarding carousel** — pehli login par 5-slide guided welcome
- **Dashboard vs Admin console** — investor ka portfolio/ledger alag, team ka control panel alag
- **Realtime (Socket.IO)** — request status, token mint, property updates turant dikhte hain

## Abhi kya pending hai (go-live se pehle)
- Coinbase live API keys + webhook secret — abhi demo mode
- Fiat payment gateway (card/bank) — abhi simulated
- Google/Apple OAuth — abhi sirf email/password
- Legal/compliance, KYC/AML, terms review
- Share supply validation aur ledger audits
- Apple Developer account
- Unit/integration tests

---

## English technical notes (brief)
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript 5.9 — migrated from the old Vite SPA
- **Backend:** Express + Mongoose (MongoDB), JWT auth, Socket.IO realtime, multer + Cloudinary uploads, Resend email
- **Models:** User, Property, PurchaseRequest, Transaction, Token (hash-chain), CryptoPayment, Settings, Notification, Activity, ErrorLog
- **Investment settle:** atomic oversell guard → transaction + fee accrual → Flux Chain token mint
- **Coinbase Commerce:** LIVE (API key + signed HMAC webhooks, fail-closed) / DEMO (simulated charge, auto-confirms ~20s)
