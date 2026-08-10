import { Link } from "react-router-dom";
import OwnershipBar from "./OwnershipBar";
import { money } from "../lib/format";

export default function PropertyCard({ property, footer }) {
  const pctFunded = property.totalShares
    ? Math.round((property.soldShares / property.totalShares) * 100)
    : 0;
  const thumbStyle = property.imageUrl
    ? { backgroundImage: `url(${property.imageUrl})` }
    : { background: `linear-gradient(135deg, hsl(${property.hue} 45% 30%), hsl(${(property.hue + 50) % 360} 45% 18%))` };

  return (
    <Link to={`/property/${property.id}`} className="propCard" aria-label={`${property.name} — invest in fractional shares`}>
      <div
        className="propThumb"
        style={thumbStyle}
        role="img"
        aria-label={property.imageUrl ? `${property.name} in ${property.city}` : `${property.name} — placeholder`}
      >
        {!property.imageUrl && <span className="propThumbInitials">{property.initials}</span>}
        <div className="propThumbTop">
          <span className="propYield">▲ {property.yieldPct}% APY</span>
          {property.featured && <span className="propFeatured">★ Featured</span>}
        </div>
      </div>
      <div className="propBody">
        <div className="propTitleRow">
          <div className="propName">{property.name}</div>
        </div>
        <div className="propMeta">
          {property.city} · {property.type}
        </div>
        <div className="propFundRow">
          <span className="propFundLabel">
            {pctFunded}% funded · {property.soldShares}/{property.totalShares} shares
          </span>
          <OwnershipBar sold={property.soldShares} total={property.totalShares} />
        </div>
        <div className="propFoot">
          <div>
            <div className="propPrice">{money(property.pricePerShare)}</div>
            <div className="propPriceLabel">per share</div>
          </div>
          {footer || <span className="propCta">Invest →</span>}
        </div>
      </div>
    </Link>
  );
}
