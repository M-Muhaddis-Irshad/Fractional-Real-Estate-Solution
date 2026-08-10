import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import PropertyCard from "../components/PropertyCard";
import Reveal from "../components/Reveal";
import Photo from "../components/Photo";
import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";
import { moneyShort } from "../lib/format";

const LANDING_LINKS = [
  { href: "/our-story", label: "Our Story" },
  { href: "#properties", label: "Properties" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
];

/* Royalty-free photography (Unsplash CDN, auto WebP). */
const IMGS = {
  heroSkyline:
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80",
  logistics:
    "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=400&q=80",
  villa:
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80",
};

const DEFAULT_CONTENT = {
  hero: {
    badge: "MARKET LIVE: +1.2% TODAY",
    title: "Own a fraction.",
    highlight: "Earn the whole return.",
    subtitle:
      "Access institutional-grade real estate assets through fractional ownership. Secure, transparent, and built for the next generation of global investors.",
    primaryCta: "Explore Assets",
    secondaryCta: "How it Works",
  },
  stats: [
    { label: "Properties Listed", value: "12" },
    { label: "Total Value", value: "$480M" },
    { label: "Avg. Yield", value: "8.6%" },
    { label: "Active Investors", value: "24K" },
  ],
  features: [
    { title: "Institutional vetting", text: "Every asset is underwritten and verified by our expert real-estate team before it ever reaches the marketplace." },
    { title: "Automatic distributions", text: "Rental income is collected and distributed to shareholders automatically, no paperwork required." },
    { title: "Blockchain-secured", text: "Ownership is recorded immutably on-chain with transparent, verifiable share records." },
    { title: "Full liquidity options", text: "Trade fractional shares on the secondary market whenever you want to exit a position." },
    { title: "Regulation-compliant", text: "Securities issued under Reg D/S exemptions with investor accreditation built in." },
    { title: "Transparent reporting", text: "Track distributions, fees and asset performance in a single consolidated dashboard." },
  ],
  testimonials: [
    { quote: "The clearest path to owning real estate without the barriers. My first distribution arrived on schedule, exactly as promised.", name: "Alex Vance", role: "PRO Investor" },
    { quote: "Finally a platform that treats fractional investing like a serious asset class. The analytics are world-class.", name: "Sara Ahmed", role: "PRO Investor" },
    { quote: "I diversified across three cities with a fraction of the capital a single unit would demand.", name: "Omar Farooq", role: "Investor" },
  ],
  faqs: [
    { q: "How does fractional ownership work?", a: "Each property is divided into a fixed number of shares. You buy shares at a set price, become a shareholder, and earn a proportional share of rental income." },
    { q: "When do I receive distributions?", a: "Net rental income is distributed to shareholders automatically at the end of each month, after management fees." },
    { q: "Can I sell my shares?", a: "Yes. Active shares can be traded on the secondary market, subject to liquidity and platform rules." },
    { q: "Is my investment protected?", a: "Every property is legally ring-fenced and insured, and ownership records are immutable and verifiable." },
  ],
  blog: [],
  cta: {
    title: "Ready to build your portfolio?",
    subtitle: "Join thousands of investors already earning from the world's most resilient asset class.",
    button: "Get Started",
  },
};

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

function Hero({ content, properties, stats, user, onJoin }) {
  const totalValue = properties.reduce((s, p) => s + p.totalValue, 0);
  return (
    <section className="lnHero">
      <div className="lnHeroBg" aria-hidden="true" />
      <div className="lnHeroInner">
        <div className="lnHeroBadge">
          <span className="lnDot" /> {content.badge}
        </div>
        <h1 className="lnHeroTitle">
          {content.title} <span className="lnGrad">{content.highlight}</span>
        </h1>
        <p className="lnHeroSub">{content.subtitle}</p>
        <div className="lnHeroActions">
          <a href="#properties" className="btn btnPrimary btnLg">
            {content.primaryCta} →
          </a>
          <a href="#how" className="btn btnGhost btnLg">
            {content.secondaryCta}
          </a>
        </div>
        {stats && stats.length > 0 && (
          <div className="lnHeroStats">
            {stats.map((s) => (
              <div className="lnHeroStat" key={s.label}>
                <div className="lnHeroStatVal">{s.value}</div>
                <div className="lnHeroStatLabel">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        <div className="lnTrustRow">
          <span>SEC REGISTERED</span>
          <span>$250M INSURANCE</span>
          <span>AES-256 ENCRYPTED</span>
        </div>
      </div>

      <div className="lnHeroVisual">
        <Photo
          src={IMGS.heroSkyline}
          alt="Modern city skyline at dusk"
          className="lnHeroPhoto"
          ratio="4/3"
          eager
        />
        <div className="lnDashCard">
          <div className="lnDashHead">
            <div>
              <div className="lnDashTitle">Portfolio value</div>
              <div className="lnDashValue">{moneyShort(totalValue || 480000000)}</div>
            </div>
            <span className="lnRise">▲ +12.4%</span>
          </div>
          <div className="lnChart">
            {[38, 52, 44, 66, 58, 78, 70, 92, 84, 100, 96, 112].map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="lnDashGrid">
            <div>
              <div className="lnMiniLabel">Avg. yield</div>
              <div className="lnMiniVal">8.6%</div>
            </div>
            <div>
              <div className="lnMiniLabel">Distributions</div>
              <div className="lnMiniVal">Monthly</div>
            </div>
            <div>
              <div className="lnMiniLabel">Investors</div>
              <div className="lnMiniVal">24K+</div>
            </div>
          </div>
        </div>
        <div className="lnFloatingCard lnFc1">
          <img src={IMGS.logistics} alt="Hyderabad Logistics Hub" className="lnFcThumb" loading="lazy" decoding="async" />
          <div>
            <div className="lnFcTitle">New drop available</div>
            <div className="lnFcSub">Hyderabad Logistics Hub · 10.2% APY</div>
          </div>
        </div>
        <div className="lnFloatingCard lnFc2">
          <img src={IMGS.villa} alt="Bahria Orchard Villa" className="lnFcThumb" loading="lazy" decoding="async" />
          <div>
            <div className="lnFcTitle">Distribution paid</div>
            <div className="lnFcSub">+$214.50 this month</div>
          </div>
        </div>
      </div>
      {!user && (
        <button className="lnHeroJoin" onClick={onJoin}>
          Create your free investor account →
        </button>
      )}
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", icon: "◎", title: "Browse assets", text: "Explore vetted properties with transparent yields, share prices and funding progress." },
    { n: "02", icon: "▤", title: "Request shares", text: "Choose how many shares you want. Our team reviews and approves your purchase." },
    { n: "03", icon: "◈", title: "Earn monthly", text: "Rental income flows to you automatically as a shareholder — no paperwork, ever." },
  ];
  return (
    <section className="lnSection" id="how">
      <Reveal className="lnSectionHead">
        <div className="lnEyebrow">How it works</div>
        <h2 className="lnSectionTitle">From signup to your first distribution</h2>
        <p className="lnSectionSub">Three steps stand between you and institutional-grade real estate.</p>
      </Reveal>
      <div className="lnSteps">
        {steps.map((s, i) => (
          <Reveal className="lnStep" delay={i * 90} key={s.n}>
            <div className="lnStepIcon">{s.icon}</div>
            <div className="lnStepNum">{s.n}</div>
            <div className="lnStepTitle">{s.title}</div>
            <div className="lnStepText">{s.text}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Features({ features }) {
  const icons = ["◈", "▤", "⬡", "⇄", "◎", "◇"];
  return (
    <section className="lnSection lnSectionAlt" id="features">
      <Reveal className="lnSectionHead">
        <div className="lnEyebrow">Why Flux</div>
        <h2 className="lnSectionTitle">Built like an institution. Designed for everyone.</h2>
        <p className="lnSectionSub">Every detail engineered for security, clarity and compounding returns.</p>
      </Reveal>
      <div className="lnFeatureGrid">
        {features.map((f, i) => (
          <Reveal className="lnFeature" delay={(i % 3) * 80} key={f.title}>
            <div className="lnFeatureIcon">{icons[i % icons.length]}</div>
            <div className="lnFeatureTitle">{f.title}</div>
            <div className="lnFeatureText">{f.text}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Testimonials({ testimonials }) {
  return (
    <section className="lnSection">
      <Reveal className="lnSectionHead">
        <div className="lnEyebrow">Investor stories</div>
        <h2 className="lnSectionTitle">Trusted by thousands of investors</h2>
      </Reveal>
      <div className="lnQuoteGrid">
        {testimonials.map((t, i) => (
          <Reveal className="lnQuote" delay={i * 90} key={t.name}>
            <div className="lnQuoteMark">“</div>
            <div className="lnQuoteText">{t.quote}</div>
            <div className="lnQuoteAuthor">
              <span className="lnQuoteAvatar">{t.name.split(" ").map((w) => w[0]).join("")}</span>
              <div>
                <div className="lnQuoteName">{t.name}</div>
                <div className="lnQuoteRole">{t.role}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Faq({ faqs }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="lnSection" id="faq">
      <Reveal className="lnSectionHead">
        <div className="lnEyebrow">FAQ</div>
        <h2 className="lnSectionTitle">Questions, answered</h2>
      </Reveal>
      <div className="lnFaqList">
        {faqs.map((f, i) => (
          <div className={"lnFaq" + (open === i ? " lnFaqOpen" : "")} key={f.q}>
            <button className="lnFaqQ" onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{f.q}</span>
              <span className="lnFaqToggle">{open === i ? "−" : "+"}</span>
            </button>
            <div className="lnFaqA">{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BlogPreview({ posts }) {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="lnSection lnSectionAlt">
      <Reveal className="lnSectionHead">
        <div className="lnEyebrow">From the blog</div>
        <h2 className="lnSectionTitle">Latest insights</h2>
      </Reveal>
      <div className="lnBlogGrid">
        {posts.slice(0, 3).map((p, i) => (
          <Reveal className="lnBlog" delay={i * 80} key={p.title}>
            <span className="lnBlogTag">{p.tag}</span>
            <h3 className="lnBlogTitle">{p.title}</h3>
            <p className="lnBlogExcerpt">{p.excerpt}</p>
            <div className="lnBlogDate">{p.date}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CtaBand({ cta, onJoin }) {
  return (
    <section className="lnCta" id="cta">
      <Reveal className="lnCtaInner">
        <h2 className="lnCtaTitle">{cta.title}</h2>
        <p className="lnCtaSub">{cta.subtitle}</p>
        <button className="btn btnPrimary btnLg" onClick={onJoin}>
          {cta.button} →
        </button>
        <div className="lnCtaNote">No real transactions occur. Demo platform only.</div>
      </Reveal>
    </section>
  );
}



export default function Landing() {
  const { user, properties, content } = useApp();
  const c = { ...DEFAULT_CONTENT, ...(content || {}) };
  c.hero = { ...DEFAULT_CONTENT.hero, ...(c.hero || {}) };
  c.cta = { ...DEFAULT_CONTENT.cta, ...(c.cta || {}) };

  const featured = useMemo(() => {
    const active = properties.filter((p) => p.status === "active" || !p.status);
    const featuredProps = active.filter((p) => p.featured);
    const rest = active.filter((p) => !p.featured).sort((a, b) => b.soldShares / b.totalShares - a.soldShares / a.totalShares);
    return [...featuredProps, ...rest].slice(0, 4);
  }, [properties]);

  const onJoin = () => scrollToId("properties");

  return (
    <div className="landingPage">
      <PublicNav user={user} links={LANDING_LINKS} onJoin={onJoin} />
      <main>
        <Hero content={c.hero} stats={c.stats} properties={properties} user={user} onJoin={onJoin} />

        <section className="lnSection" id="properties">
          <Reveal className="lnSectionHead">
            <div className="lnEyebrow">Live marketplace</div>
            <h2 className="lnSectionTitle">Featured investment opportunities</h2>
            <p className="lnSectionSub">Institutional-grade assets, professionally managed, open to everyone.</p>
          </Reveal>
          {featured.length === 0 ? (
            <div className="lnEmpty">Properties are being prepared — check back soon.</div>
          ) : (
            <div className="lnPropGrid">
              {featured.map((p, i) => (
                <Reveal delay={(i % 4) * 80} key={p.id}>
                  <PropertyCard property={p} />
                </Reveal>
              ))}
            </div>
          )}
        </section>

        <HowItWorks />
        <Features features={c.features} />
        <Testimonials testimonials={c.testimonials} />
        <Faq faqs={c.faqs} />
        <BlogPreview posts={c.blog} />
        <CtaBand cta={c.cta} onJoin={onJoin} />
      </main>
      <PublicFooter />
    </div>
  );
}
