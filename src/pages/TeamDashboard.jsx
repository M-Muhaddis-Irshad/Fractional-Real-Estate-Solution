import React from "react";
import { useApp } from "../context/AppContext";
import { money } from "../lib/format";
import Stat from "../components/Stat";

export default function TeamDashboard() {
  const {
    purchaseRequests,
    pendingRequests,
    teamFee,
    teamEarnings,
    processRequest,
    setTeamFee,
    notify,
  } = useApp();

  const handleApprove = (reqId) => {
    const result = processRequest(reqId, "approve");
    if (!result.ok) {
      notify(result.error, "error");
    }
  };

  const handleReject = (reqId) => {
    processRequest(reqId, "reject");
  };

  const allRequests = purchaseRequests;

  return (
    <>
      <div className="heroStats">
        <Stat label="Pending requests" value={pendingRequests.length} />
        <Stat label="Team earnings" value={money(teamEarnings)} />
        <Stat label="Fee rate" value={`${teamFee}%`} />
      </div>

      <h2 className="sectionHeading">Team fee configuration</h2>
      <div className="feeConfigCard">
        <div className="feeSliderRow">
          <span className="feeLabel">Team fee: <strong>{teamFee}%</strong></span>
          <input
            type="range"
            min="2"
            max="2.5"
            step="0.05"
            value={teamFee}
            onChange={(e) => setTeamFee(parseFloat(e.target.value))}
            className="feeSlider"
          />
          <div className="feeRangeLabels">
            <span>2.00%</span>
            <span>2.50%</span>
          </div>
        </div>
      </div>

      <h2 className="sectionHeading">Purchase requests</h2>

      {allRequests.length === 0 ? (
        <div className="empty">
          <div className="emptyTitle">No requests yet.</div>
          <div className="emptySub">Requests from users will appear here for review.</div>
        </div>
      ) : (
        <div className="ledgerList">
          {allRequests.map((req) => (
            <div key={req.id} className="teamReqCard">
              <div className="teamReqMain">
                <div>
                  <div className="cardName">{req.propertyName}</div>
                  <div className="cardMeta">
                    {req.shares} shares · {req.date} · {req.time}
                  </div>
                </div>
                <div className="teamReqNums">
                  <div className="ledgerInvested">{money(req.totalCost)}</div>
                  <div className="cardMeta">Fee: {money(req.teamFeeAmount)} ({req.teamFeePct}%)</div>
                </div>
              </div>
              <div className="teamReqStatus">
                {req.status === "pending" && (
                  <div className="teamReqActions">
                    <button className="approveBtn" onClick={() => handleApprove(req.id)}>
                      Approve
                    </button>
                    <button className="rejectBtn" onClick={() => handleReject(req.id)}>
                      Reject
                    </button>
                  </div>
                )}
                {req.status === "approved" && (
                  <div className="statusBadge statusApproved">Approved</div>
                )}
                {req.status === "rejected" && (
                  <div className="statusBadge statusRejected">Rejected</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
