import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import OwnershipBar from "../../components/OwnershipBar";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import { money } from "../../lib/format";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, requestInvestment, teamFee } = useApp();
  const property = properties.find((p) => p.id === id);

  const [shareCount, setShareCount] = useState(1);
  const [error, setError] = useState(null);
  const [justRequested, setJustRequested] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!property) {
    return (
      <div className="card">
        <EmptyState icon="?" title="Property not found" sub="It may have been removed from the marketplace.">
          <Link to="/discover" className="btn btnPrimary">Back to Discover</Link>
        </EmptyState>
      </div>
    );
  }

  const remaining = Math.max(0, property.totalShares - property.soldShares);
  const cost = shareCount * property.pricePerShare;
  const teamFeeAmount = (cost * teamFee) / 100;
  const ownPct = property.totalShares ? ((shareCount / property.totalShares) * 100).toFixed(3) : 0;
  const paused = property.investingOpen === false;
  const clamp = (n) => Math.min(Math.max(1, n), Math.max(remaining, 1));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await requestInvestment(property.id, shareCount);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setJustRequested(result.request);
    setShareCount(1);
  };

  const thumbStyle = property.imageUrl
    ? { backgroundImage: `url(${property.imageUrl})` }
    : { background: `linear-gradient(135deg, hsl(${property.hue} 45% 32%), hsl(${(property.hue + 50) % 360} 45% 18%))` };

  return (
    <div className="riseIn">
      <Link to="/discover" className="dBackLink">← Back to Discover</Link>

      <div className="pdGrid">
        <div className="pdMain">
          <div className="pdThumb" style={thumbStyle}>
            {!property.imageUrl && <span className="pdThumbInitials">{property.initials}</span>}
            <div className="pdThumbBadges">
              {property.featured && <Badge status="active" label="★ Featured" />}
              {paused && <Badge status="suspended" label="Investing paused" />}
            </div>
          </div>
          <div className="pdTitleRow">
            <div>
              <h1 className="pdName">{property.name}</h1>
              <div className="pdMeta">{property.city} · {property.type}</div>
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
              <span className="dStrong">{Math.round((property.soldShares / property.totalShares) * 100)}% funded</span>
            </div>
            <OwnershipBar sold={property.soldShares} total={property.totalShares} />
            <div className="pdFundedMeta">{property.soldShares} of {property.totalShares} shares sold</div>
          </div>
        </div>

        <aside className="pdPanel">
          {justRequested ? (
            <div className="card cardPad pdReceipt">
              <div className="pdReceiptIcon">✓</div>
              <div className="pdReceiptTitle">Request submitted</div>
              <div className="pdReceiptSub">Your request is awaiting team approval.</div>
              <div className="pdReceiptRows">
                <div><span>Shares requested</span><span>{justRequested.shares}</span></div>
                <div><span>Price per share</span><span>{money(justRequested.pricePerShare)}</span></div>
                <div><span>Total cost</span><span className="dStrong">{money(justRequested.totalCost)}</span></div>
                <div><span>Team fee ({justRequested.teamFeePct}%)</span><span>{money(justRequested.teamFeeAmount)}</span></div>
                <div><span>Date</span><span>{justRequested.date} · {justRequested.time}</span></div>
              </div>
              <Badge status="pending" />
              <div className="pdReceiptActions">
                <button className="btn btnPrimary btnBlock" onClick={() => setJustRequested(null)}>
                  Submit another request
                </button>
                <button className="btn btnGhost btnBlock" onClick={() => navigate("/ledger")}>
                  View my requests
                </button>
              </div>
            </div>
          ) : (
            <div className="card cardPad">
              <div className="pdPanelTitle">Invest in this property</div>

              <div className="pdStepperRow">
                <span className="pdPanelLabel">Shares to buy</span>
                <div className="pdStepper">
                  <button className="pdStepBtn" onClick={() => setShareCount((s) => clamp(s - 1))}>−</button>
                  <input
                    className="pdStepInput"
                    type="number"
                    min={1}
                    max={remaining}
                    value={shareCount}
                    onChange={(e) => setShareCount(clamp(parseInt(e.target.value || "1", 10)))}
                  />
                  <button className="pdStepBtn" onClick={() => setShareCount((s) => clamp(s + 1))}>+</button>
                </div>
              </div>

              <div className="pdSummary">
                <div><span>Price per share</span><span>{money(property.pricePerShare)}</span></div>
                <div><span>Total cost</span><span className="dStrong">{money(cost)}</span></div>
                <div><span>Team fee ({teamFee}%)</span><span>{money(teamFeeAmount)}</span></div>
                <div><span>Resulting ownership</span><span>{ownPct}%</span></div>
              </div>

              {error && <div className="errorText pdError">{error}</div>}

              <button
                className={"btn btnPrimary btnBlock btnLg" + (remaining <= 0 || paused ? " dDisabled" : "")}
                onClick={handleSubmit}
                disabled={remaining <= 0 || paused || submitting}
              >
                {submitting
                  ? "Submitting…"
                  : paused
                    ? "Investing paused"
                    : remaining <= 0
                      ? "Fully subscribed"
                      : "Submit for approval"}
              </button>
              <div className="pdDisclaimer">
                Your request is reviewed by the team. No funds move until approved.
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
