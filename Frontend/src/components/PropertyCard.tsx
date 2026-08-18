import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Star, TrendingUp } from "lucide-react";
import OwnershipBar from "./OwnershipBar";
import { money } from "@/lib/format";
import type { Property } from "@/lib/types";

interface PropertyCardProps {
  property: Property;
  footer?: ReactNode;
}

/**
 * PropertyCard — marketplace card used on the landing page, Discover and admin
 * listings. The card itself is a <div> so callers can inject their own footer
 * (e.g. a dual "View Details" + "Invest" button row) via the `footer` prop;
 * the thumbnail and name are links to the property detail page.
 */
export default function PropertyCard({ property, footer }: PropertyCardProps) {
  const pctFunded = property.totalShares
    ? Math.round((property.soldShares / property.totalShares) * 100)
    : 0;
  const thumbStyle = property.imageUrl
    ? { backgroundImage: `url(${property.imageUrl})` }
    : {
        background: `linear-gradient(135deg, hsl(${property.hue} 45% 30%), hsl(${(property.hue + 50) % 360} 45% 18%))`,
      };
  const href = `/property/${property.id}`;

  return (
    <div className="propCard" aria-label={`${property.name} — invest in fractional shares`}>
      <Link
        href={href}
        className="propThumb"
        style={thumbStyle}
        aria-label={
          property.imageUrl ? `${property.name} in ${property.city}` : `${property.name} — placeholder`
        }
      >
        {!property.imageUrl && <span className="propThumbInitials">{property.initials}</span>}
        <span className="propTypeBadge">{property.type}</span>
        <div className="propThumbTop">
          <span className="propYield">
            <TrendingUp size={11} /> {property.yieldPct}% APY
          </span>
          {property.featured && (
            <span className="propFeatured">
              <Star size={11} fill="currentColor" /> Featured
            </span>
          )}
        </div>
        <span className="propFundPill">{pctFunded}% funded</span>
      </Link>
      <div className="propBody">
        <Link href={href} className="propName">
          {property.name}
        </Link>
        <div className="propMeta">
          {property.city} · {property.type}
        </div>
        <div className="propFundRow">
          <span className="propFundLabel">
            {property.soldShares}/{property.totalShares} shares
          </span>
          <OwnershipBar sold={property.soldShares} total={property.totalShares} />
        </div>
        <div className="propPriceRow">
          <div className="propPrice">{money(property.pricePerShare)}</div>
          <div className="propPriceLabel">per share</div>
        </div>
        <div className="propFoot">
          {footer || (
            <Link href={href} className="propCta">
              Invest <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
