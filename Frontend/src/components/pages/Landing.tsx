"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Fingerprint,
  Hexagon,
  Landmark,
  Lock,
  Minus,
  Plus,
  Scale,
  Search,
  Send,
  Shield,
  ShieldCheck,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";
import Photo from "@/components/Photo";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { moneyShort } from "@/lib/format";
import type { Property, SiteContent, TrustChip, User } from "@/lib/types";

const LANDING_LINKS = [
  { href: "/our-story", label: "Our Story" },
  { href: "#properties", label: "Properties" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQs" },
];

/* Royalty-free photography (Unsplash CDN, auto WebP). */
const IMGS = {
  heroSkyline:
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80",
  logistics:
    "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=400&q=80",
  villa: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80",
};

/**
 * Trust chips are admin-editable via content.trustChips — the `icon` field is a
 * lucide icon name picked from this registry in the admin content editor.
 */
const TRUST_ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  Shield,
  Lock,
  BadgeCheck,
  CheckCircle2,
  Fingerprint,
  Landmark,
};

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

function Hero({
  hero,
  stats,
  trustChips,
  properties,
  user,
  onJoin,
}: {
  hero?: SiteContent["hero"];
  stats?: SiteContent["stats"];
  trustChips?: TrustChip[];
  properties: Property[];
  user?: User | null;
  onJoin: () => void;
}) {
  const totalValue = properties.reduce((s, p) => s + p.totalValue, 0);
  const statVal = (label: string) => stats?.find((s) => s.label === label)?.value;
  const avgYield = statVal("Avg. Yield");
  const propsListed = statVal("Properties Listed");
  const investors = statVal("Active Investors");

  // Real property-derived floating cards — replaces the old hardcoded "New drop"
  // card and the invented "+Rs 214.50 this month" distribution card.
  const newest = useMemo(() => {
    const active = properties.filter((p) => p.status === "active" || !p.status);
    return [...active].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )[0];
  }, [properties]);

  const mostFunded = useMemo(() => {
    const active = properties.filter((p) => p.status === "active" || !p.status);
    return [...active].sort(
      (a, b) => b.soldShares / b.totalShares - a.soldShares / a.totalShares
    )[0];
  }, [properties]);

  return (
    <section className="lnHero">
      <div className="lnHeroBg" aria-hidden="true" />
      <div className="lnHeroWrap">
        <div className="lnHeroInner">
          {hero?.badge && (
            <div className="lnHeroBadge">
              <span className="lnDot" /> {hero.badge}
            </div>
          )}
          <h1 className="lnHeroTitle">
            {hero?.title || ""}{" "}
            {hero?.highlight && <span className="lnGrad">{hero.highlight}</span>}
          </h1>
          {hero?.subtitle && <p className="lnHeroSub">{hero.subtitle}</p>}
          <div className="lnHeroActions">
            <a href="#properties" className="btn btnGold btnLg">
              {hero?.primaryCta || "Explore assets"} <ArrowRight size={16} />
            </a>
            <a href="#how" className="btn btnGhost btnLg">
              {hero?.secondaryCta || "How it works"}
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
          {trustChips && trustChips.length > 0 && (
            <div className="lnTrustRow">
              {trustChips.map((c) => {
                const Icon = (c.icon && TRUST_ICONS[c.icon]) || ShieldCheck;
                return (
                  <span key={c.label}>
                    <Icon size={11} /> {c.label}
                  </span>
                );
              })}
            </div>
          )}
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
                <div className="lnDashValue">{moneyShort(totalValue)}</div>
              </div>
              {avgYield && (
                <span className="lnRise">
                  <TrendingUp size={12} /> {avgYield} avg yield
                </span>
              )}
            </div>
            <div className="lnChart">
              {[38, 52, 44, 66, 58, 78, 70, 92, 84, 100, 96, 112].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="lnDashGrid">
              <div>
                <div className="lnMiniLabel">Properties listed</div>
                <div className="lnMiniVal">{propsListed || "—"}</div>
              </div>
              <div>
                <div className="lnMiniLabel">Distributions</div>
                <div className="lnMiniVal">Monthly</div>
              </div>
              <div>
                <div className="lnMiniLabel">Investors</div>
                <div className="lnMiniVal">{investors || "—"}</div>
              </div>
            </div>
          </div>
          {newest && (
            <div className="lnFloatingCard lnFc1">
              <img
                src={newest.imageUrl || IMGS.logistics}
                alt={newest.name}
                className="lnFcThumb"
                loading="lazy"
                decoding="async"
              />
              <div>
                <div className="lnFcTitle">Newest listing</div>
                <div className="lnFcSub">
                  {newest.name} · {newest.yieldPct}% APY
                </div>
              </div>
            </div>
          )}
          {mostFunded && mostFunded.id !== newest?.id && (
            <div className="lnFloatingCard lnFc2">
              <img
                src={mostFunded.imageUrl || IMGS.villa}
                alt={mostFunded.name}
                className="lnFcThumb"
                loading="lazy"
                decoding="async"
              />
              <div>
                <div className="lnFcTitle">Most funded</div>
                <div className="lnFcSub">
                  {mostFunded.name} ·{" "}
                  {Math.round((mostFunded.soldShares / mostFunded.totalShares) * 100)}% funded
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {!user && (
        <button className="lnHeroJoin" onClick={onJoin}>
          Create your free investor account <ArrowRight size={13} />
        </button>
      )}
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: Search,
      title: "Browse assets",
      text: "Explore vetted properties with transparent yields, share prices and funding progress.",
    },
    {
      n: "02",
      icon: Send,
      title: "Request shares",
      text: "Choose how many shares you want. Our team reviews and approves your purchase.",
    },
    {
      n: "03",
      icon: Wallet,
      title: "Earn monthly",
      text: "Rental income flows to you automatically as a shareholder — no paperwork, ever.",
    },
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
            <div className="lnStepIcon">
              <s.icon size={19} />
            </div>
            <div className="lnStepNum">{s.n}</div>
            <div className="lnStepTitle">{s.title}</div>
            <div className="lnStepText">{s.text}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Features({ features }: { features?: SiteContent["features"] }) {
  const icons = [ShieldCheck, Wallet, Hexagon, ArrowLeftRight, Scale, FileText];
  if (!features || features.length === 0) return null;
  return (
    <section className="lnSection lnSectionAlt" id="features">
      <div className="lnSplit">
        <Reveal className="lnSplitMedia">
          <Photo
            src={IMGS.villa}
            alt="Bahria Orchard Villa — a residential asset on the Flux marketplace"
            className="lnSplitPhoto"
            ratio="4/3"
          />
        </Reveal>
        <div className="lnSplitBody">
          <Reveal>
            <div className="lnEyebrow">Why Flux</div>
            <h2 className="lnSectionTitle">Built like an institution. Designed for everyone.</h2>
            <p className="lnSectionSub">Every detail engineered for security, clarity and compounding returns.</p>
          </Reveal>
          <div className="lnSplitList">
            {features.map((f, i) => {
              const Icon = icons[i % icons.length];
              return (
                <Reveal className="lnSplitItem" delay={(i % 2) * 80} key={f.title}>
                  <span className="lnSplitIcon">
                    <Icon size={17} />
                  </span>
                  <div>
                    <div className="lnSplitItemTitle">{f.title}</div>
                    <div className="lnSplitItemText">{f.text}</div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials({
  testimonials,
  stats,
  ctaButton,
  onJoin,
}: {
  testimonials?: SiteContent["testimonials"];
  stats?: SiteContent["stats"];
  ctaButton?: string;
  onJoin: () => void;
}) {
  if (!testimonials || testimonials.length === 0) return null;
  // Large member-count intro (ref: Reference 1 — "10K+ Members" + CTA),
  // using the platform's real Active Investors stat.
  const membersStat = stats?.find((s) => s.label === "Active Investors");

  return (
    <section className="lnSection">
      <div className="lnTrustHead">
        <Reveal className="lnTrustHeadText">
          <div className="lnEyebrow">Investor stories</div>
          <h2 className="lnSectionTitle">Trusted by thousands of investors</h2>
          {membersStat && (
            <div className="lnTrustCount">
              <span className="lnTrustNum">{membersStat.value}</span>
              <span className="lnTrustCountLabel">{membersStat.label}</span>
            </div>
          )}
        </Reveal>
        <Reveal delay={90}>
          <button className="btn btnGold btnLg" onClick={onJoin}>
            {ctaButton || "Get Started"} <ArrowRight size={16} />
          </button>
        </Reveal>
      </div>
      <div className="lnQuoteGrid">
        {testimonials.map((t, i) => (
          <Reveal className="lnQuote" delay={i * 90} key={t.name}>
            <div className="lnQuoteMark">“</div>
            <div className="lnQuoteText">{t.quote}</div>
            <div className="lnQuoteAuthor">
              <span className="lnQuoteAvatar">
                {t.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </span>
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

function Faq({ faqs }: { faqs?: SiteContent["faqs"] }) {
  const [open, setOpen] = useState(0);
  if (!faqs || faqs.length === 0) return null;
  return (
    <section className="lnSection" id="faq">
      <Reveal className="lnSectionHead">
        <h2 className="lnSectionTitle">FAQs</h2>
      </Reveal>
      <div className="lnFaqList">
        {faqs.map((f, i) => (
          <div className={"lnFaq" + (open === i ? " lnFaqOpen" : "")} key={f.q}>
            <button className="lnFaqQ" onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{f.q}</span>
              <span className="lnFaqToggle">{open === i ? <Minus size={16} /> : <Plus size={16} />}</span>
            </button>
            <div className="lnFaqA">{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BlogPreview({ posts }: { posts?: SiteContent["blog"] }) {
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

function StatBanner({ stats }: { stats?: SiteContent["stats"] }) {
  // Full-width dark band with one large gold number (ref: Reference 1 —
  // "PKR 1.9Bn+ invested"), using the platform's real Total Value + count stats.
  if (!stats || stats.length === 0) return null;
  const totalStat = stats.find((s) => s.label === "Total Value");
  const countStat = stats.find((s) => s.label === "Properties Listed");
  if (!totalStat) return null;

  return (
    <section className="lnStatBanner" aria-label="Platform statistics">
      <div className="lnStatBannerInner">
        <div className="lnStatBannerLabel">Total value of assets listed</div>
        <div className="lnStatBannerValue">{totalStat.value}</div>
        {countStat && (
          <div className="lnStatBannerSub">
            Across {countStat.value} institutional-grade assets — professionally managed and open to
            every investor.
          </div>
        )}
      </div>
    </section>
  );
}

function CtaBand({ cta, onJoin }: { cta?: SiteContent["cta"]; onJoin: () => void }) {
  if (!cta?.title) return null;
  return (
    <section className="lnCta" id="cta">
      <Reveal className="lnCtaInner">
        <h2 className="lnCtaTitle">{cta.title}</h2>
        {cta.subtitle && <p className="lnCtaSub">{cta.subtitle}</p>}
        <button className="btn btnPrimary btnLg" onClick={onJoin}>
          {cta.button || "Get Started"} <ArrowRight size={16} />
        </button>
        <div className="lnCtaNote">No real transactions occur. Demo platform only.</div>
      </Reveal>
    </section>
  );
}

export default function Landing() {
  const { user, properties, content } = useApp();
  // `content` comes from GET /settings/content (server fallback is the single
  // source of truth — no local DEFAULT_CONTENT duplicate here).
  const c = content;

  const active = useMemo(
    () => properties.filter((p) => p.status === "active" || !p.status),
    [properties]
  );

  const featured = useMemo(() => {
    const featuredProps = active.filter((p) => p.featured);
    const rest = active
      .filter((p) => !p.featured)
      .sort((a, b) => b.soldShares / b.totalShares - a.soldShares / a.totalShares);
    return [...featuredProps, ...rest].slice(0, 4);
  }, [active]);

  // Pill filter tabs above the grid — derived from real property types
  // (ref: Reference 1's filter tabs; Option A per approval, no new schema field).
  const filterTypes = useMemo(
    () => ["All", ...Array.from(new Set(active.map((p) => p.type).filter(Boolean)))],
    [active]
  );
  const [filter, setFilter] = useState("All");
  const visible = useMemo(
    () => (filter === "All" ? featured : featured.filter((p) => p.type === filter)),
    [featured, filter]
  );

  const onJoin = () => scrollToId("properties");

  return (
    <div className="landingPage">
      <PublicNav user={user} links={LANDING_LINKS} onJoin={onJoin} />
      <main>
        <Hero
          hero={c?.hero}
          stats={c?.stats}
          trustChips={c?.trustChips}
          properties={properties}
          user={user}
          onJoin={onJoin}
        />

        <section className="lnSection" id="properties">
          <div className="lnPropHead">
            <Reveal className="lnSectionHead lnSectionHeadLeft">
              <div className="lnEyebrow">Live marketplace</div>
              <h2 className="lnSectionTitle">Featured investment opportunities</h2>
              <p className="lnSectionSub">
                Institutional-grade assets, professionally managed, open to everyone.
              </p>
            </Reveal>
            <div className="pillRow lnPropFilters" role="tablist" aria-label="Filter properties by type">
              {filterTypes.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={filter === t}
                  onClick={() => setFilter(t)}
                  className={"pill lnPropPill" + (filter === t ? " pillActive" : "")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <div className="lnEmpty">Properties are being prepared — check back soon.</div>
          ) : (
            <div className="lnPropGrid">
              {visible.map((p, i) => (
                <Reveal delay={(i % 4) * 80} key={p.id}>
                  <PropertyCard
                    property={p}
                    footer={
                      <div className="propFootBtns">
                        <Link href={`/property/${p.id}`} className="btn btnGhost btnSm">
                          View Details
                        </Link>
                        <Link href={`/property/${p.id}`} className="btn btnGold btnSm">
                          Invest <ArrowRight size={13} />
                        </Link>
                      </div>
                    }
                  />
                </Reveal>
              ))}
            </div>
          )}
        </section>

        <StatBanner stats={c?.stats} />

        <HowItWorks />
        <Features features={c?.features} />
        <Testimonials
          testimonials={c?.testimonials}
          stats={c?.stats}
          ctaButton={c?.cta?.button}
          onJoin={onJoin}
        />
        <Faq faqs={c?.faqs} />
        <BlogPreview posts={c?.blog} />
        <CtaBand cta={c?.cta} onJoin={onJoin} />
      </main>
      <PublicFooter />
    </div>
  );
}
