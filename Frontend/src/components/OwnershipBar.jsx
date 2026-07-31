import React from "react";

export default function OwnershipBar({ sold, total }) {
  const pctValue = Math.min(100, (sold / total) * 100);
  const ticks = 24;
  const filledTicks = Math.round((pctValue / 100) * ticks);

  return (
    <div className="ownershipWrap">
      <div className="ownershipLabel">
        <span className="fundedPct">{pctValue.toFixed(0)}% Funded</span>
        <span className="sharesLeft">{total - sold} Shares Left</span>
      </div>
      <div className="ownershipTicks">
        {Array.from({ length: ticks }).map((_, i) => (
          <div key={i} className={"tick" + (i < filledTicks ? " tickFilled" : "")} />
        ))}
      </div>
    </div>
  );
}
