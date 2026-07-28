import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import OwnershipBar from "../components/OwnershipBar";
import { money } from "../lib/format";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, requestInvestment, wallet, teamFee } = useApp();
  const property = properties.find((p) => p.id === id);

  const [shareCount, setShareCount] = useState(1);
  const [error, setError] = useState(null);
  const [justRequested, setJustRequested] = useState(null);

  if (!property) {
    return (
      <div className="empty">
        <div className="emptyTitle">Property not found.</div>
        <Link className="primaryBtn" to="/">
          Back to Discover
        </Link>
      </div>
    );
  }

  const remaining = property.totalShares - property.soldShares;
  const cost = shareCount * property.pricePerShare;
  const teamFeeAmount = (cost * teamFee) / 100;
  const ownPct = ((shareCount / property.totalShares) * 100).toFixed(3);
  const clamp = (n) => Math.min(Math.max(1, n), Math.max(remaining, 1));

  const handleSubmit = () => {
    setError(null);
    const result = requestInvestment(property.id, shareCount);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setJustRequested(result.request);
    setShareCount(1);
  };

  return (
    <div className="detailPage">
      <Link to="/" className="backLink">
        ← Back to Discover
      </Link>

      <div className="detailGrid">
        <div className="detailMain">
          <div className="thumb thumbLarge" style={{ background: `hsl(${property.hue} 45% 22%)` }}>
            {property.initials}
          </div>
          <h1 className="detailName">{property.name}</h1>
          <div className="cardMeta">
            {property.city} · {property.type}
          </div>
          <p className="detailDescription">{property.description}</p>

          <div className="heroStats">
            <div className="statBox">
              <div className="statValue">{money(property.totalValue)}</div>
              <div className="statLabel">Total property value</div>
            </div>
            <div className="statBox">
              <div className="statValue">{property.yieldPct}%</div>
              <div className="statLabel">Projected annual yield</div>
            </div>
            <div className="statBox">
              <div className="statValue">{property.totalShares}</div>
              <div className="statLabel">Total shares</div>
            </div>
          </div>

          <OwnershipBar sold={property.soldShares} total={property.totalShares} />
        </div>

        <div className="investPanel">
          {justRequested ? (
            <div className="receiptCard">
              <div className="receiptHead receiptHeadPending">Request submitted</div>
              <div className="summaryRow">
                <span>Shares requested</span>
                <span>{justRequested.shares}</span>
              </div>
              <div className="summaryRow">
                <span>Price per share</span>
                <span>{money(justRequested.pricePerShare)}</span>
              </div>
              <div className="summaryRow">
                <span>Total cost</span>
                <span className="accentMono">{money(justRequested.totalCost)}</span>
              </div>
              <div className="summaryRow">
                <span>Team fee ({justRequested.teamFeePct}%)</span>
                <span>{money(justRequested.teamFeeAmount)}</span>
              </div>
              <div className="summaryRow">
                <span>Date</span>
                <span>
                  {justRequested.date} · {justRequested.time}
                </span>
              </div>
              <div className="statusBadge statusPending">Pending team approval</div>
              <div className="receiptActions">
                <button className="primaryBtn" onClick={() => setJustRequested(null)}>
                  Submit another request
                </button>
                <button className="ghostBtn" onClick={() => navigate("/portfolio")}>
                  View my requests
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="investPanelTitle">Invest in this property</div>

              <div className="stepperRow">
                <span className="cardMeta">Shares to buy</span>
                <div className="stepper">
                  <button className="stepBtn" onClick={() => setShareCount((s) => clamp(s - 1))}>
                    –
                  </button>
                  <input
                    className="stepInput"
                    type="number"
                    min={1}
                    max={remaining}
                    value={shareCount}
                    onChange={(e) => setShareCount(clamp(parseInt(e.target.value || "1", 10)))}
                  />
                  <button className="stepBtn" onClick={() => setShareCount((s) => clamp(s + 1))}>
                    +
                  </button>
                </div>
              </div>

              <div className="summaryBox">
                <div className="summaryRow">
                  <span>Price per share</span>
                  <span>{money(property.pricePerShare)}</span>
                </div>
                <div className="summaryRow">
                  <span>Total cost</span>
                  <span className="accentMono">{money(cost)}</span>
                </div>
                <div className="summaryRow">
                  <span>Team fee ({teamFee}%)</span>
                  <span>{money(teamFeeAmount)}</span>
                </div>
                <div className="summaryRow">
                  <span>Resulting ownership</span>
                  <span>{ownPct}%</span>
                </div>
                <div className="summaryRow">
                  <span>Wallet balance</span>
                  <span>{money(wallet)}</span>
                </div>
              </div>

              {error && <div className="errorText">{error}</div>}

              <button
                className={"confirmBtn" + (remaining <= 0 ? " disabledBtn" : "")}
                onClick={handleSubmit}
                disabled={remaining <= 0}
              >
                {remaining <= 0 ? "Fully subscribed" : "Submit for approval"}
              </button>
              <div className="disclaimer">
                Your request will be reviewed by the team. No funds move until approved.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
