import React from "react";
import { Link } from "react-router-dom";
import OwnershipBar from "./OwnershipBar";
import { money } from "../lib/format";

export default function PropertyCard({ property }) {
  const remaining = property.totalShares - property.soldShares;
  const soldOut = remaining <= 0;

  return (
    <Link to={`/property/${property.id}`} className="card">
      <div className="thumb" style={{ background: `hsl(${property.hue} 45% 22%)` }}>
        {property.initials}
      </div>
      <div className="cardBody">
        <div className="cardTopRow">
          <div>
            <div className="cardName">{property.name}</div>
            <div className="cardMeta">
              {property.city} · {property.type}
            </div>
          </div>
          <div className="yieldPill">{property.yieldPct}% yield</div>
        </div>

        <OwnershipBar sold={property.soldShares} total={property.totalShares} />

        <div className="cardFooter">
          <div>
            <div className="priceValue">{money(property.pricePerShare)}</div>
            <div className="cardMeta">per share</div>
          </div>
          <span className={"primaryBtn" + (soldOut ? " disabledBtn" : "")}>
            {soldOut ? "Fully subscribed" : "View & invest"}
          </span>
        </div>
      </div>
    </Link>
  );
}
