import React from "react";
import { Link } from "react-router-dom";
import OwnershipBar from "./OwnershipBar";
import { moneyCents } from "../lib/format";

export default function PropertyCard({ property }) {
  const remaining = property.totalShares - property.soldShares;
  const soldOut = remaining <= 0;

  return (
    <Link to={`/property/${property.id}`} className="card">
      <div className="thumb" style={{ background: `hsl(${property.hue} 45% 20%)` }}>
        <span className="thumbInitials">{property.initials}</span>
        <span className="thumbGrad" />
      </div>
      <div className="cardBody">
        <div className="cardTopRow">
          <div>
            <div className="cardName">{property.name}</div>
            <div className="cardMeta">{property.city}</div>
          </div>
          <span className="typePill">{property.type}</span>
        </div>

        <OwnershipBar sold={property.soldShares} total={property.totalShares} />

        <div className="cardFooter">
          <div className="priceBlock">
            <div className="priceLabel">Price per share</div>
            <div className="priceValue">{moneyCents(property.pricePerShare)}</div>
          </div>
          <span className={"viewBtn" + (soldOut ? " viewBtnSold" : "")}>
            {soldOut ? "Sold Out" : "View Details"}
          </span>
        </div>
      </div>
    </Link>
  );
}
