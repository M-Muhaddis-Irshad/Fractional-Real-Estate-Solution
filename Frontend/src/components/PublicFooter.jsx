import { Link } from "react-router-dom";

/**
 * PublicFooter — organized sitemap footer shared by the landing page and the
 * "Our Story" page. Anchor links use plain <a href="/#…"> so they work from
 * any route and scroll to the landing section.
 */
export default function PublicFooter() {
  return (
    <footer className="lnFooter">
      <div className="lnFooterInner">
        <div className="lnFooterCol lnFooterBrandCol">
          <Link to="/" className="lnBrand" aria-label="Flux — home">
            <img src="/logo/logo.png" alt="" className="lnLogo" width={30} height={30} />
            <span>Flux</span>
          </Link>
          <p>The world's premier gateway to fractional real estate liquidity. Redefining property ownership for the digital age.</p>
        </div>
        <div className="lnFooterCol">
          <div className="lnFooterHead">Company</div>
          <Link to="/our-story">Our Story</Link>
          <a href="/#how">How it works</a>
          <a href="/#faq">FAQ</a>
          <a href="/#cta">Contact</a>
        </div>
        <div className="lnFooterCol">
          <div className="lnFooterHead">Marketplace</div>
          <a href="/#properties">Latest drops</a>
          <Link to="/login">Secondary market</Link>
          <Link to="/discover">Discover assets</Link>
        </div>
        <div className="lnFooterCol">
          <div className="lnFooterHead">Platform</div>
          <a href="/#features">Why Flux</a>
          <a href="/#features">Security</a>
          <Link to="/login">Investor kit</Link>
        </div>
        <div className="lnFooterCol">
          <div className="lnFooterHead">Compliance</div>
          <p className="lnFooterLegal">
            Real estate investments involve risks. Performance is not guaranteed. Fractional tokens are
            issued under Reg D/S exemptions. Please consult your financial advisor before committing capital.
          </p>
        </div>
      </div>
      <div className="lnFooterBottom">
        <span>© {new Date().getFullYear()} Obsidian Flux LLC. All rights reserved.</span>
        <div className="lnFooterLegalLinks">
          <Link to="/our-story#terms">Terms</Link>
          <Link to="/our-story#terms">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
