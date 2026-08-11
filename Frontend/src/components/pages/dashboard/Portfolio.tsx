"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import Stat from "@/components/Stat";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import { TokenCard, TokenCertificate } from "@/components/TokenCertificate";
import { money } from "@/lib/format";
import type { Token } from "@/lib/types";

export default function Portfolio() {
  const { holdings, transactions, purchaseRequests, portfolioTotals, tokens } = useApp();
  const [openTx, setOpenTx] = useState<string | null>(null);
  const [openToken, setOpenToken] = useState<Token | null>(null);

  const pending = purchaseRequests.filter((r) => r.status === "pending");
  const rejected = purchaseRequests.filter((r) => r.status === "rejected");

  const empty = holdings.length === 0 && pending.length === 0 && rejected.length === 0;

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">My Ledger</div>
          <h1 className="pageTitle">Portfolio &amp; transactions</h1>
          <p className="pageSub">Every share, request and receipt in one place.</p>
        </div>
      </div>

      <div className="kpiGrid">
        <Stat label="Total invested" value={money(portfolioTotals.invested)} />
        <Stat label="Total shares held" value={portfolioTotals.shares} />
        <Stat label="Properties held" value={portfolioTotals.count} />
        <Stat label="Pending requests" value={pending.length} />
      </div>

      {empty ? (
        <div className="card">
          <EmptyState icon="▤" title="Your ledger is blank" sub="Head to Discover — your first investment settles instantly.">
            <Link href="/discover" className="btn btnPrimary">
              Discover properties
            </Link>
          </EmptyState>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <div className="sectionHeading">Pending requests</div>
              <div className="tableWrap">
                <div className="tableScroll">
                  <table className="dataTable">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Shares</th>
                        <th>Date</th>
                        <th>Total cost</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((req) => (
                        <tr key={req.id}>
                          <td className="dStrong">{req.propertyName}</td>
                          <td>{req.shares}</td>
                          <td className="dMuted">{req.date}</td>
                          <td className="dStrong">{money(req.totalCost)}</td>
                          <td>
                            <Badge status="pending" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {rejected.length > 0 && (
            <>
              <div className="sectionHeading">Rejected requests</div>
              <div className="tableWrap">
                <div className="tableScroll">
                  <table className="dataTable">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Shares</th>
                        <th>Date</th>
                        <th>Total cost</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejected.map((req) => (
                        <tr key={req.id}>
                          <td className="dStrong">{req.propertyName}</td>
                          <td>{req.shares}</td>
                          <td className="dMuted">{req.date}</td>
                          <td className="dStrong">{money(req.totalCost)}</td>
                          <td>
                            <Badge status="rejected" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tokens.length > 0 && (
            <>
              <div className="sectionHeading">
                My tokens <span className="dMuted">— minted on the Flux Chain</span>
              </div>
              <div className="tkGrid">
                {tokens.map((t) => (
                  <TokenCard key={t.id} token={t} onOpen={setOpenToken} />
                ))}
              </div>
            </>
          )}

          {holdings.length > 0 && (
            <>
              <div className="sectionHeading">Holdings</div>
              <div className="tableWrap">
                <div className="tableScroll">
                  <table className="dataTable">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Shares owned</th>
                        <th>Invested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h) => (
                        <tr key={h.propertyId}>
                          <td>
                            <Link href={`/property/${h.propertyId}`} className="dTableLink">
                              {h.name}
                            </Link>
                          </td>
                          <td>{h.shares}</td>
                          <td className="dStrong">{money(h.invested)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="sectionHeading">Transaction history</div>
          <div className="tableWrap">
            <div className="tableScroll">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Date</th>
                    <th>Shares</th>
                    <th>Price / share</th>
                    <th>Total</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <Link href={`/property/${t.propertyId}`} className="dTableLink">
                          {t.name}
                        </Link>
                      </td>
                      <td className="dMuted">
                        {t.date} · {t.time}
                      </td>
                      <td>{t.shares}</td>
                      <td className="dMuted">{money(t.pricePerShare)}</td>
                      <td className="dStrong">{money(t.total)}</td>
                      <td>
                        <button
                          className="dReceiptBtn"
                          onClick={() => setOpenTx(openTx === t.id ? null : t.id)}
                        >
                          {openTx === t.id ? "Hide ▴" : "View ▾"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="tableEmpty">
                        No completed transactions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {transactions.map((t) =>
            openTx === t.id ? (
              <div className="card cardPad dReceipt" key={t.id}>
                <div className="cardTitle">{t.name}</div>
                <div className="cardSub">
                  {t.date} · {t.time} · {t.shares} shares
                </div>
                <div className="pdReceiptRows">
                  <div>
                    <span>Price per share</span>
                    <span>{money(t.pricePerShare)}</span>
                  </div>
                  <div>
                    <span>Shares</span>
                    <span>{t.shares}</span>
                  </div>
                  <div>
                    <span>Total</span>
                    <span className="dStrong">{money(t.total)}</span>
                  </div>
                  {t.teamFee != null && (
                    <div>
                      <span>Team fee ({t.teamFeePct}%)</span>
                      <span>{money(t.teamFee)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null
          )}

          {openToken && <TokenCertificate token={openToken} onClose={() => setOpenToken(null)} />}
        </>
      )}
    </div>
  );
}
