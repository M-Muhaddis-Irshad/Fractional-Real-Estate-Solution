import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Stat from "../components/Stat";
import { money } from "../lib/format";

export default function Portfolio() {
  const { holdings, transactions, purchaseRequests, portfolioTotals, wallet, topUpWallet } = useApp();
  const [openTx, setOpenTx] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState("");

  return (
    <>
      <div className="heroStats">
        <Stat label="Wallet balance" value={money(wallet)} />
        <Stat label="Total invested" value={money(portfolioTotals.invested)} />
        <Stat label="Total shares held" value={portfolioTotals.shares} />
        <Stat label="Properties held" value={portfolioTotals.count} />
      </div>

      <div className="topUpSection">
        <span className="topUpSectionLabel">Add funds to wallet</span>
        <div className="topUpSectionRow">
          {[100000, 500000, 1000000].map((amt) => (
            <button key={amt} className="topUpPresetBtn" onClick={() => topUpWallet(amt)}>
              {money(amt)}
            </button>
          ))}
          <input
            className="topUpInput"
            type="number"
            placeholder="Custom"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && topUpAmount) {
                topUpWallet(topUpAmount);
                setTopUpAmount("");
              }
            }}
          />
          <button
            className="primaryBtn"
            disabled={!topUpAmount}
            onClick={() => { topUpWallet(topUpAmount); setTopUpAmount(""); }}
          >
            Add
          </button>
        </div>
      </div>

      {holdings.length === 0 && purchaseRequests.filter(r => r.status === "pending").length === 0 && purchaseRequests.filter(r => r.status === "rejected").length === 0 ? (
        <div className="empty">
          <div className="emptyTitle">Your ledger is blank.</div>
          <div className="emptySub">Head to Discover and submit a purchase request to get started.</div>
          <Link className="primaryBtn" to="/">
            Discover properties
          </Link>
        </div>
      ) : (
        <>
          {purchaseRequests.filter(r => r.status === "pending").length > 0 && (
            <>
              <h2 className="sectionHeading">Pending requests</h2>
              <div className="ledgerList">
                {purchaseRequests.filter(r => r.status === "pending").map((req) => (
                  <div key={req.id} className="ledgerRow">
                    <div>
                      <div className="cardName">{req.propertyName}</div>
                      <div className="cardMeta">
                        {req.shares} shares · {req.date}
                      </div>
                    </div>
                    <div className="ledgerNums">
                      <div className="ledgerInvested">{money(req.totalCost)}</div>
                      <div className="statusBadge statusPending">Pending</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {purchaseRequests.filter(r => r.status === "rejected").length > 0 && (
            <>
              <h2 className="sectionHeading">Rejected requests</h2>
              <div className="ledgerList">
                {purchaseRequests.filter(r => r.status === "rejected").map((req) => (
                  <div key={req.id} className="ledgerRow">
                    <div>
                      <div className="cardName">{req.propertyName}</div>
                      <div className="cardMeta">
                        {req.shares} shares · {req.date}
                      </div>
                    </div>
                    <div className="ledgerNums">
                      <div className="ledgerInvested">{money(req.totalCost)}</div>
                      <div className="statusBadge statusRejected">Rejected</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {holdings.length > 0 && (
            <>
              <h2 className="sectionHeading">Holdings</h2>
              <div className="ledgerList">
                {holdings.map((h) => (
                  <div key={h.propertyId} className="ledgerRow">
                    <div className="cardName">{h.name}</div>
                    <div className="ledgerNums">
                      <div className="ledgerInvested">{money(h.invested)}</div>
                      <div className="cardMeta">{h.shares} shares</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <h2 className="sectionHeading">Transaction history</h2>
          <div className="ledgerList">
            {transactions.map((t) => (
              <div key={t.id} className="txRow">
                <button className="txHead" onClick={() => setOpenTx(openTx === t.id ? null : t.id)}>
                  <div>
                    <div className="cardName">{t.name}</div>
                    <div className="cardMeta">
                      {t.date} · {t.time} · {t.shares} shares
                    </div>
                  </div>
                  <div className="ledgerInvested">{money(t.total)}</div>
                </button>
                {openTx === t.id && (
                  <div className="receiptDetail">
                    <div className="summaryRow">
                      <span>Price per share</span>
                      <span>{money(t.pricePerShare)}</span>
                    </div>
                    <div className="summaryRow">
                      <span>Shares</span>
                      <span>{t.shares}</span>
                    </div>
                    <div className="summaryRow">
                      <span>Total</span>
                      <span className="accentMono">{money(t.total)}</span>
                    </div>
                    {t.teamFee != null && (
                      <div className="summaryRow">
                        <span>Team fee ({t.teamFeePct}%)</span>
                        <span className="accentMono">{money(t.teamFee)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
