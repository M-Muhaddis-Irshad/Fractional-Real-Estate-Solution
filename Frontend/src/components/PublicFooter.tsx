import Link from "next/link";

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
          <Link href="/" className="lnBrand" aria-label="Flux — home">
            <img src="/logo/logo.webp" alt="" className="lnLogo" width={30} height={30} />
            <span>Flux</span>
          </Link>
          <p>
            The world&apos;s premier gateway to fractional real estate liquidity. Redefining property
            ownership for the digital age.
          </p>
        </div>
        <div className="lnFooterCol">
          <div className="lnFooterHead">Company</div>
          <Link href="/our-story">Our Story</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/#cta">Contact</Link>
        </div>
        <div className="lnFooterCol">
          <div className="lnFooterHead">Marketplace</div>
          <Link href="/#properties">Latest drops</Link>
          <Link href="/login">Secondary market</Link>
          <Link href="/discover">Discover assets</Link>
          <Link href="/#properties">List your property</Link>
        </div>
        <div className="lnFooterCol">
          <div className="lnFooterHead">Platform</div>
          <Link href="/#features">Why Flux</Link>
          <Link href="/#features">Security</Link>
          <Link href="/login">Investor kit</Link>
        </div>
        <div className="lnFooterCol">
          <div className="lnFooterHead">Compliance</div>
          <p className="lnFooterLegal">
            Real estate investments involve risks. Performance is not guaranteed. Fractional tokens
            are issued under Reg D/S exemptions. Please consult your financial advisor before
            committing capital.
          </p>
        </div>
      </div>
      <div className="lnFooterBottom">
        <span>© {new Date().getFullYear()} Obsidian Flux LLC. All rights reserved.</span>
        <div className="lnFooterLegalLinks">
          <Link href="/our-story#terms">Terms</Link>
          <Link href="/our-story#terms">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
