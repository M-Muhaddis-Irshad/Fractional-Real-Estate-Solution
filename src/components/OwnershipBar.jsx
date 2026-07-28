import React from "react";

export default function OwnershipBar({ sold, total }) {
  const pctValue = Math.min(100, (sold / total) * 100);
  const ticks = 20;
  const filledTicks = Math.round((pctValue / 100) * ticks);

  return (
    <div className="ownershipWrap">
      <div className="ownershipTicks">
        {Array.from({ length: ticks }).map((_, i) => (
          <div key={i} className={"tick" + (i < filledTicks ? " tickFilled" : "")} />
        ))}
      </div>
      <div className="ownershipLabel">
        <span>{pctValue.toFixed(0)}% subscribed</span>
        <span>{total - sold} shares left</span>
      </div>
    </div>
  );
}
