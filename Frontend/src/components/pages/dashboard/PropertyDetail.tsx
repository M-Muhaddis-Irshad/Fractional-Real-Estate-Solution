"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bitcoin,
  Check,
  Coins,
  ExternalLink,
  Minus,
  Plus,
  SearchX,
  Star,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import OwnershipBar from "@/components/OwnershipBar";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import { money, shortHash, cryptoFmt } from "@/lib/format";
import type { PurchaseRequest, Token } from "@/lib/types";

const CRYPTO_CURRENCIES = ["BTC", "ETH", "USDC", "USDT"];

const CRYPTO_STEP = [
  { key: "pending", label: "Awaiting payment" },
  { key: "confirming", label: "Confirming on-chain" },
  { key: "confirmed", label: "Confirmed" },
];

interface ReceiptLike {
  shares: number;
  pricePerShare: number;
  totalCost?: number;
  total?: number;
  teamFeePct?: number;
  teamFeeAmount?: number;
  date?: string;
  time?: string;
}

export default function PropertyDetail({ id }: { id: string }) {
  const router = useRouter();
  const {
    properties,
    requestInvestment,
    createCryptoPayment,
    getCryptoPaymentStatus,
    getCryptoRates,
    teamFee,
  } = useApp();
  const property = properties.find((p) => p.id === id);

  const [shareCount, setShareCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [justRequested, setJustRequested] = useState<PurchaseRequest | null>(null);
  const [justToken, setJustToken] = useState<Token | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Crypto payment state
  const [payMethod, setPayMethod] = useState<"instant" | "crypto">("instant");
  const [cryptoCurrency, setCryptoCurrency] = useState("BTC");
  const [cryptoRates, setCryptoRates] = useState<{ rates: Record<string, number>; simulated?: boolean } | null>(null);
  const [cryptoPayment, setCryptoPayment] = useState<{
    id: string;
    status: string;
    currency: string;
    shares: number;
    pricePerShare: number;
    totalUsd: number;
    cryptoAmount: number;
    walletAddress?: string;
    hostedUrl?: string;
    txHash?: string;
    explorerUrl?: string;
    demo?: boolean;
  } | null>(null);
  const [cryptoResult, setCryptoResult] = useState<{
    request?: PurchaseRequest | null;
    transaction?: unknown;
    token?: Token | null;
  } | null>(null);
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const [cryptoBusy, setCryptoBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCryptoRates().then(setCryptoRates).catch(() => {});
  }, [getCryptoRates]);

  // Poll payment status until it reaches a terminal state.
  useEffect(() => {
    const paymentId = cryptoPayment?.id;
    const status = cryptoPayment?.status;
    if (!paymentId || !status || ["confirmed", "failed", "expired"].includes(status)) return;

    const timer = setInterval(async () => {
      try {
        const data = await getCryptoPaymentStatus(paymentId);
        setCryptoPayment(data.payment);
        if (data.payment.status === "confirmed") {
          setCryptoResult({
            request: data.request || null,
            transaction: data.transaction || null,
            token: data.token || null,
          });
        }
      } catch {
        /* keep polling */
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [cryptoPayment?.id, cryptoPayment?.status, getCryptoPaymentStatus]);

  if (!property) {
    return (
      <div className="card">
        <EmptyState icon={<SearchX size={22} />} title="Property not found" sub="It may have been removed from the marketplace.">
          <Link href="/discover" className="btn btnPrimary">
            Back to Discover
          </Link>
        </EmptyState>
      </div>
    );
  }

  const remaining = Math.max(0, property.totalShares - property.soldShares);
  const cost = shareCount * property.pricePerShare;
  const teamFeeAmount = (cost * teamFee) / 100;
  const ownPct = property.totalShares ? ((shareCount / property.totalShares) * 100).toFixed(3) : 0;
  const paused = property.investingOpen === false;
  const clamp = (n: number) => Math.min(Math.max(1, n), Math.max(remaining, 1));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await requestInvestment(property.id, shareCount);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Something went wrong.");
      return;
    }
    setJustRequested(result.request || null);
    setJustToken(result.token || null);
    setShareCount(1);
  };

  const handleCryptoSubmit = async () => {
    setCryptoError(null);
    setCryptoBusy(true);
    try {
      const data = await createCryptoPayment(property.id, shareCount, cryptoCurrency);
      setCryptoPayment(data.payment);
    } catch (err) {
      setCryptoError((err as Error).message);
    } finally {
      setCryptoBusy(false);
    }
  };

  const resetCrypto = () => {
    setCryptoPayment(null);
    setCryptoResult(null);
    setCryptoError(null);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(cryptoPayment?.walletAddress || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const estAmount = cryptoRates ? cost / (cryptoRates.rates[cryptoCurrency] || 1) : null;
  const cryptoStatus = cryptoPayment?.status;
  const stepIdx = cryptoStatus === "confirmed" ? 2 : cryptoStatus === "confirming" ? 1 : 0;
  const showSteps = ["pending", "confirming", "confirmed"].includes(cryptoStatus || "");

  const thumbStyle = property.imageUrl
    ? { backgroundImage: `url(${property.imageUrl})` }
    : {
        background: `linear-gradient(135deg, hsl(${property.hue} 45% 32%), hsl(${(property.hue + 50) % 360} 45% 18%))`,
      };

  const receipt: ReceiptLike | null = justRequested
    ? (justRequested as unknown as ReceiptLike)
    : cryptoStatus === "confirmed"
      ? (cryptoResult?.request as ReceiptLike | null | undefined) || null
      : null;
  const receiptToken = cryptoStatus === "confirmed" ? cryptoResult?.token : justToken;

  return (
    <div className="riseIn">
      <Link href="/discover" className="dBackLink">
        <ArrowLeft size={13} /> Back to Discover
      </Link>

      <div className="pdGrid">
        <div className="pdMain">
          <div
            className="pdThumb"
            style={thumbStyle}
            role="img"
            aria-label={property.imageUrl ? `${property.name} in ${property.city}` : `${property.name} — placeholder`}
          >
            {!property.imageUrl && <span className="pdThumbInitials">{property.initials}</span>}
            <div className="pdThumbBadges">
              {property.featured && (
                <Badge status="active" label={"Featured"}>
                  <Star size={11} fill="currentColor" />
                </Badge>
              )}
              {paused && <Badge status="suspended" label="Investing paused" />}
            </div>
          </div>
          <div className="pdTitleRow">
            <div>
              <h1 className="pdName">{property.name}</h1>
              <div className="pdMeta">
                {property.city} · {property.type}
              </div>
            </div>
            <div className="pdYieldBox">
              <div className="pdYieldVal">{property.yieldPct}%</div>
              <div className="pdYieldLabel">APY</div>
            </div>
          </div>
          <p className="pdDesc">{property.description}</p>

          <div className="kpiGrid pdStats">
            <div className="kpi">
              <div className="kpiLabel">Total value</div>
              <div className="kpiValue">{money(property.totalValue)}</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">Price / share</div>
              <div className="kpiValue">{money(property.pricePerShare)}</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">Total shares</div>
              <div className="kpiValue">{property.totalShares}</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">Remaining</div>
              <div className="kpiValue">{remaining}</div>
            </div>
          </div>

          <div className="pdFunded">
            <div className="pdFundedHead">
              <span>Funding progress</span>
              <span className="dStrong">
                {Math.round((property.soldShares / property.totalShares) * 100)}% funded
              </span>
            </div>
            <OwnershipBar sold={property.soldShares} total={property.totalShares} />
            <div className="pdFundedMeta">
              {property.soldShares} of {property.totalShares} shares sold
            </div>
          </div>
        </div>

        <aside className="pdPanel">
          {receipt && !cryptoPayment ? (
            <div className="card cardPad pdReceipt">
              <div className="pdReceiptIcon">
                <Check size={20} />
              </div>
              <div className="pdReceiptTitle">Investment complete</div>
              <div className="pdReceiptSub">
                {receiptToken
                  ? "Your shares are secured and your ownership token was minted on the Flux Chain — no approval needed."
                  : "Your shares are secured. Your ownership certificate will appear in your portfolio."}
              </div>
              <div className="pdReceiptRows">
                <div>
                  <span>Shares acquired</span>
                  <span>{receipt.shares}</span>
                </div>
                <div>
                  <span>Price per share</span>
                  <span>{money(receipt.pricePerShare)}</span>
                </div>
                <div>
                  <span>Total cost</span>
                  <span className="dStrong">{money(receipt.totalCost ?? receipt.total ?? 0)}</span>
                </div>
                {receipt.teamFeePct != null && (
                  <div>
                    <span>Team fee ({receipt.teamFeePct}%)</span>
                    <span>{money(receipt.teamFeeAmount || 0)}</span>
                  </div>
                )}
                {receipt.date && (
                  <div>
                    <span>Date</span>
                    <span>
                      {receipt.date} · {receipt.time}
                    </span>
                  </div>
                )}
                {receiptToken && (
                  <>
                    <div>
                      <span>Token ID</span>
                      <span className="dMono">{receiptToken.tokenId}</span>
                    </div>
                    <div>
                      <span>Block</span>
                      <span className="dMono">#{receiptToken.blockNumber}</span>
                    </div>
                    <div>
                      <span>Block hash</span>
                      <span className="dMono">{shortHash(receiptToken.hash)}</span>
                    </div>
                  </>
                )}
              </div>
              <Badge status="approved" label="Completed" />
              <div className="pdReceiptActions">
                <button
                  className="btn btnPrimary btnBlock"
                  onClick={() => {
                    setJustRequested(null);
                    setJustToken(null);
                    resetCrypto();
                  }}
                >
                  Invest in another property
                </button>
                <button className="btn btnGhost btnBlock" onClick={() => router.push("/ledger")}>
                  View tokens &amp; portfolio
                </button>
              </div>
            </div>
          ) : cryptoPayment ? (
            <div className="card cardPad">
              {cryptoStatus === "confirmed" ? (
                <div className="pdReceipt">
                  <div className="pdReceiptIcon">
                    <Check size={20} />
                  </div>
                  <div className="pdReceiptTitle">Crypto payment confirmed</div>
                  <div className="pdReceiptSub">
                    {cryptoResult?.token
                      ? "Your shares are secured and your ownership token was minted on the Flux Chain."
                      : "Your shares are secured. Your ownership certificate will appear in your portfolio."}
                  </div>
                  <div className="pdReceiptRows">
                    <div>
                      <span>Shares acquired</span>
                      <span>{cryptoPayment.shares}</span>
                    </div>
                    <div>
                      <span>Price per share</span>
                      <span>{money(cryptoPayment.pricePerShare)}</span>
                    </div>
                    <div>
                      <span>Total cost</span>
                      <span className="dStrong">{money(cryptoPayment.totalUsd)}</span>
                    </div>
                    <div>
                      <span>Paid in</span>
                      <span>{cryptoFmt(cryptoPayment.cryptoAmount, cryptoPayment.currency)}</span>
                    </div>
                    {cryptoPayment.txHash && (
                      <div>
                        <span>Tx hash</span>
                        {cryptoPayment.explorerUrl ? (
                          <a
                            className="cryptoExplorer"
                            href={cryptoPayment.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {shortHash(cryptoPayment.txHash, 8, 6)} <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="dMono">{shortHash(cryptoPayment.txHash)}</span>
                        )}
                      </div>
                    )}
                    {cryptoResult?.token && (
                      <>
                        <div>
                          <span>Token ID</span>
                          <span className="dMono">{cryptoResult.token.tokenId}</span>
                        </div>
                        <div>
                          <span>Block</span>
                          <span className="dMono">#{cryptoResult.token.blockNumber}</span>
                        </div>
                        <div>
                          <span>Block hash</span>
                          <span className="dMono">{shortHash(cryptoResult.token.hash)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <Badge status="approved" label="Completed" />
                  <div className="pdReceiptActions">
                    <button
                      className="btn btnPrimary btnBlock"
                      onClick={() => {
                        resetCrypto();
                        setShareCount(1);
                      }}
                    >
                      Invest in another property
                    </button>
                    <button className="btn btnGhost btnBlock" onClick={() => router.push("/ledger")}>
                      View tokens &amp; portfolio
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cryptoPay">
                  <div className="pdReceiptIcon cryptoPayIcon">
                    {cryptoPayment.currency === "BTC" ? <Bitcoin size={20} /> : <Coins size={20} />}
                  </div>
                  <div className="pdReceiptTitle">
                    {cryptoStatus === "failed"
                      ? "Payment failed"
                      : cryptoStatus === "expired"
                        ? "Payment expired"
                        : "Complete your crypto payment"}
                  </div>
                  <div className="pdReceiptSub">
                    {cryptoPayment.demo
                      ? "Demo mode — no gateway configured. Pay the exact demo amount below; it auto-confirms in ~20 seconds."
                      : "Send the exact amount to the checkout to finalise your investment."}
                  </div>

                  {showSteps && (
                    <div className="cryptoSteps" aria-label={`Payment status: ${cryptoStatus}`}>
                      {CRYPTO_STEP.map((s, i) => (
                        <div
                          key={s.key}
                          className={
                            "cryptoStep" +
                            (i < stepIdx ? " cryptoStepDone" : "") +
                            (i === stepIdx ? " cryptoStepActive" : "")
                          }
                        >
                          <span className="cryptoStepDot">{i < stepIdx ? <Check size={13} /> : i + 1}</span>
                          <span className="cryptoStepLabel">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pdReceiptRows">
                    <div>
                      <span>Shares</span>
                      <span>{cryptoPayment.shares}</span>
                    </div>
                    <div>
                      <span>Total (USD)</span>
                      <span className="dStrong">{money(cryptoPayment.totalUsd)}</span>
                    </div>
                    <div>
                      <span>Amount ({cryptoPayment.currency})</span>
                      <span className="cryptoAmount">
                        {cryptoFmt(cryptoPayment.cryptoAmount, cryptoPayment.currency)}
                      </span>
                    </div>
                  </div>

                  {cryptoPayment.hostedUrl ? (
                    <a
                      className="btn btnPrimary btnBlock btnLg"
                      href={cryptoPayment.hostedUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open hosted checkout <ExternalLink size={13} />
                    </a>
                  ) : cryptoPayment.walletAddress ? (
                    <div className="cryptoAddr">
                      <span className="cryptoAddrLabel">
                        Send to this {cryptoPayment.currency} address
                      </span>
                      <div className="cryptoAddrRow">
                        <code className="cryptoAddrCode">{cryptoPayment.walletAddress}</code>
                        <button className="btn btnGhost cryptoCopyBtn" onClick={copyAddress}>
                          {copied ? (
                            <>
                              <Check size={12} /> Copied
                            </>
                          ) : (
                            "Copy"
                          )}
                        </button>
                      </div>
                      <div className="cryptoAddrNote">
                        Send exactly {cryptoFmt(cryptoPayment.cryptoAmount, cryptoPayment.currency)}{" "}
                        — amounts above or below are flagged as delayed by the gateway.
                      </div>
                    </div>
                  ) : null}

                  {(cryptoStatus === "failed" || cryptoStatus === "expired") && (
                    <button className="btn btnPrimary btnBlock" onClick={resetCrypto}>
                      Try again
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card cardPad">
              <div className="pdPanelTitle">Invest in this property</div>

              <div className="pdStepperRow">
                <span className="pdPanelLabel">Shares to buy</span>
                <div className="pdStepper">
                  <button className="pdStepBtn" onClick={() => setShareCount((s) => clamp(s - 1))}>
                    <Minus size={14} />
                  </button>
                  <input
                    className="pdStepInput"
                    type="number"
                    min={1}
                    max={remaining}
                    value={shareCount}
                    onChange={(e) => setShareCount(clamp(parseInt(e.target.value || "1", 10)))}
                  />
                  <button className="pdStepBtn" onClick={() => setShareCount((s) => clamp(s + 1))}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="pdSummary">
                <div>
                  <span>Price per share</span>
                  <span>{money(property.pricePerShare)}</span>
                </div>
                <div>
                  <span>Total cost</span>
                  <span className="dStrong">{money(cost)}</span>
                </div>
                <div>
                  <span>Team fee ({teamFee}%)</span>
                  <span>{money(teamFeeAmount)}</span>
                </div>
                <div>
                  <span>Resulting ownership</span>
                  <span>{ownPct}%</span>
                </div>
              </div>

              <span className="pdPanelLabel">Payment method</span>
              <div className="payMethodGrid">
                <button
                  type="button"
                  className={"payMethodCard" + (payMethod === "instant" ? " payMethodActive" : "")}
                  onClick={() => setPayMethod("instant")}
                >
                  <span className="payMethodIcon">
                    <Zap size={16} />
                  </span>
                  <span className="payMethodTitle">Instant settlement</span>
                  <span className="payMethodSub">Demo — settles immediately</span>
                </button>
                <button
                  type="button"
                  className={"payMethodCard" + (payMethod === "crypto" ? " payMethodActive" : "")}
                  onClick={() => setPayMethod("crypto")}
                >
                  <span className="payMethodIcon">
                    <Bitcoin size={16} />
                  </span>
                  <span className="payMethodTitle">Pay with crypto</span>
                  <span className="payMethodSub">BTC · ETH · USDC · USDT</span>
                </button>
              </div>

              {payMethod === "instant" ? (
                <>
                  {error && <div className="errorText pdError">{error}</div>}

                  <button
                    className={"btn btnPrimary btnBlock btnLg" + (remaining <= 0 || paused ? " dDisabled" : "")}
                    onClick={handleSubmit}
                    disabled={remaining <= 0 || paused || submitting}
                  >
                    {submitting
                      ? "Investing…"
                      : paused
                        ? "Investing paused"
                        : remaining <= 0
                          ? "Fully subscribed"
                          : "Invest now"}
                  </button>
                  <div className="pdDisclaimer">
                    Your investment settles instantly — shares are sold to you immediately and your
                    ownership token is minted on the Flux Chain.
                  </div>
                </>
              ) : (
                <>
                  <span className="pdPanelLabel">Cryptocurrency</span>
                  <div className="cryptoChips">
                    {CRYPTO_CURRENCIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={"cryptoChip" + (cryptoCurrency === c ? " cryptoChipActive" : "")}
                        onClick={() => setCryptoCurrency(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {estAmount != null && (
                    <div className="cryptoEstimate">
                      ≈ {cryptoFmt(estAmount, cryptoCurrency)}{" "}
                      <span className="cryptoEstimateSub">
                        ({cryptoRates?.simulated ? "demo rate" : "live rate"} · {money(cost)})
                      </span>
                    </div>
                  )}

                  {cryptoError && <div className="errorText pdError">{cryptoError}</div>}

                  <button
                    className={"btn btnPrimary btnBlock btnLg" + (remaining <= 0 || paused ? " dDisabled" : "")}
                    onClick={handleCryptoSubmit}
                    disabled={remaining <= 0 || paused || cryptoBusy}
                  >
                    {cryptoBusy ? "Creating payment…" : `Pay with ${cryptoCurrency}`}
                  </button>
                  <div className="pdDisclaimer">
                    Payments are processed through Coinbase Commerce. Your shares settle and your
                    token is minted once the network confirms the transaction.
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
