import crypto from "node:crypto";

/**
 * Crypto payment service — Option A: custodial gateway (Coinbase Commerce).
 *
 * Why this approach instead of direct Web3 wallet integration (Option B):
 * the platform sells fractional shares and is not a wallet/custody business.
 * Coinbase Commerce handles wallet custody, on-chain conversion and payment
 * compliance tooling, so we only integrate its REST API + signed webhooks and
 * settle the share sale server-side after confirmation. Option B would require
 * ethers.js, a smart contract, an RPC provider and gas management — a much
 * larger security/audit surface with no benefit at this stage. This repo also
 * has no Web3 dependencies today, so Option A is the stated default.
 *
 * Two operating modes:
 *  - LIVE:  COINBASE_COMMERCE_API_KEY set → real charges at
 *           https://api.commerce.coinbase.com, settled from verified webhooks.
 *  - DEMO:  no key (local/dev) → a simulated charge + wallet address is
 *           returned and auto-confirms ~20s later so the whole flow is
 *           testable end-to-end. Always surfaced to the UI as "demo".
 */

const API_BASE = "https://api.commerce.coinbase.com";
const API_VERSION = "2018-03-22";

export const SUPPORTED_CURRENCIES = ["BTC", "ETH", "USDC", "USDT"];

// Placeholder USD→crypto conversion hints used only in demo mode. In LIVE mode
// the gateway returns authoritative pricing in the charge object, so these are
// never used for actual amounts.
const DEMO_RATES = { BTC: 60000, ETH: 3500, USDC: 1, USDT: 1 };

export function isConfigured() {
  return Boolean(process.env.COINBASE_COMMERCE_API_KEY);
}

export function demoMode() {
  return !isConfigured();
}

export function getRates() {
  return { ...DEMO_RATES };
}

/** USD amount → crypto amount at the (demo) rate. */
export function cryptoAmountFor(currency, amountUsd) {
  const rate = DEMO_RATES[currency] || 1;
  return amountUsd / rate;
}

const randomHex = (bytes) => crypto.randomBytes(bytes).toString("hex");

/** Illustrative wallet address for demo payments — never a real key/address. */
export function simulatedAddress(currency) {
  if (currency === "BTC") return "bc1q" + randomHex(19).toLowerCase();
  return "0x" + randomHex(20).toLowerCase();
}

async function commerceRequest(path, { method = "GET", body } = {}) {
  const headers = {
    "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY,
    "X-CC-Version": API_VERSION,
    "Content-Type": "application/json",
  };
  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Coinbase Commerce ${res.status}: ${text.slice(0, 240)}`);
  }
  return res.json();
}

/**
 * Create a fixed-price charge. In demo mode returns a synthetic charge so the
 * rest of the pipeline (model, settlement, UI) is exercised identically.
 */
export async function createCharge({ name, description, amountUsd, paymentId }) {
  if (isConfigured()) {
    const { data } = await commerceRequest("/charges", {
      method: "POST",
      body: {
        name,
        description,
        pricing_type: "fixed_price",
        local_price: { amount: amountUsd.toFixed(2), currency: "USD" },
        metadata: { paymentId },
      },
    });
    return {
      chargeId: data.id,
      chargeCode: data.code,
      hostedUrl: data.hosted_url,
      pricing: (data.pricing && data.pricing.crypto) || null,
    };
  }

  // DEMO MODE — no gateway configured; simulate the charge shape.
  return {
    chargeId: "demo_" + randomHex(10),
    chargeCode: "DEMO" + randomHex(6).toUpperCase(),
    hostedUrl: null,
    pricing: null,
  };
}

/** Fetch the current charge resource (LIVE mode only). */
export async function getChargeStatus(chargeId) {
  if (!isConfigured()) return null;
  const { data } = await commerceRequest(`/charges/${chargeId}`);
  return data;
}

/**
 * Verify a Coinbase Commerce webhook signature. Coinbase signs the RAW request
 * body with the webhook shared secret using HMAC-SHA256 and sends it in the
 * X-CC-Webhook-Signature header. Comparison is timing-attack resistant.
 * Unverified webhooks are always rejected.
 */
export function verifyWebhookSignature(rawBody, signature) {
  // In LIVE mode the real webhook secret is used. The well-known demo secret is
  // ONLY used when no gateway is configured at all (demo mode) so the pipeline
  // is testable locally. The demo secret must never be accepted in live mode:
  // if the API key is configured but the webhook secret is missing, we fail
  // closed (401) instead of trusting a publicly-known value.
  const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET
    || (isConfigured() ? null : "dev-demo-webhook-secret");
  if (!secret) return false;
  try {
    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody || "")
      .digest("hex");
    const expected = Buffer.from(computed, "hex");
    const provided = Buffer.from(String(signature || ""), "hex");
    return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

/**
 * Map a tx hash to a public block-explorer page. Uses the network reported by
 * the gateway when available, falling back to a currency-based guess.
 */
export function explorerUrl(currency, network, txHash) {
  if (!txHash) return null;
  const net = String(network || "").toLowerCase();
  if (net === "bitcoin") return `https://blockstream.info/tx/${txHash}`;
  if (net === "ethereum") return `https://etherscan.io/tx/${txHash}`;
  if (net === "solana") return `https://solscan.io/tx/${txHash}`;
  if (currency === "BTC") return `https://blockstream.info/tx/${txHash}`;
  return `https://etherscan.io/tx/${txHash}`;
}

/** A synthetic on-chain hash for demo confirmations. */
export function simulatedTxHash(currency) {
  return currency === "BTC"
    ? randomHex(32)
    : "0x" + randomHex(32);
}
