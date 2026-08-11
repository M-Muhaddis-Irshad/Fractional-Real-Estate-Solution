"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import Reveal from "@/components/Reveal";
import Photo from "@/components/Photo";

/* Royalty-free photography (Unsplash CDN, auto WebP). */
const IMGS = {
  whoWeAre:
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
  purpose:
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
  keys: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80",
  terms:
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
  support:
    "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80",
};

const STORY_LINKS = [
  { href: "/", label: "Home" },
  { href: "#story", label: "Who we are" },
  { href: "#purpose", label: "Our purpose" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#benefits", label: "Benefits" },
  { href: "#support", label: "Support" },
];

const BUY_STEPS = [
  { icon: "◎", title: "Sign up", text: "Create your free investor account in under two minutes." },
  { icon: "✓", title: "Complete KYC", text: "Verify your identity securely so you're cleared to invest." },
  { icon: "◈", title: "Browse listings", text: "Explore vetted assets with transparent yields and pricing." },
  { icon: "▤", title: "Invest in fractions", text: "Buy shares instantly — your tokens mint on the Flux Chain." },
  { icon: "⇄", title: "Track & exit", text: "Follow returns in your dashboard and resell shares anytime." },
];

const SELL_STEPS = [
  { icon: "◎", title: "List your property", text: "Submit your asset through our simple listing flow." },
  { icon: "✓", title: "Verification & valuation", text: "Our experts underwrite, inspect and professionally value it." },
  { icon: "◈", title: "Fractionalization", text: "We structure the asset into a fixed number of tradable shares." },
  { icon: "▤", title: "Go live", text: "The offering launches to thousands of qualified investors." },
  { icon: "⇄", title: "Track funding", text: "Watch shares sell and capital flow in, in real time." },
];

const BENEFITS = [
  { icon: "◎", title: "Low minimums", text: "Start with a single share — real estate ownership without a seven-figure cheque." },
  { icon: "◈", title: "Diversification", text: "Spread capital across cities, asset classes and risk profiles in minutes." },
  { icon: "▲", title: "Passive income", text: "Rental distributions land in your account automatically, every month." },
  { icon: "⬡", title: "Transparency", text: "Every property is ring-fenced, insured and fully documented." },
  { icon: "⇄", title: "Liquidity", text: "Exit positions via the secondary market instead of waiting years to sell." },
  { icon: "◇", title: "Professional management", text: "On-ground managers handle tenants, maintenance and leasing end to end." },
];

const POLICIES = [
  { title: "Risk disclosure", text: "Real estate is illiquid and values can fall. Past distributions never guarantee future returns." },
  { title: "Ownership rights", text: "Shares represent legal, ring-fenced ownership in the SPV that holds each property." },
  { title: "Fees", text: "A transparent team fee applies per purchase; management costs are disclosed per asset." },
  { title: "Exit policy", text: "Shares can be resold on the secondary market whenever a buyer matches — no lock-up surprises." },
];

const SUPPORT = [
  { icon: "◎", title: "Live chat", text: "Talk to a human in seconds — real-time, right inside the app." },
  { icon: "▤", title: "Email us", text: "support@flux.invest — replies within 4 business hours." },
  { icon: "◈", title: "Call us", text: "+1 (800) 555-0132 — Mon–Fri, 9am to 6pm PKT." },
];

const TIMELINE = [
  {
    phase: "Past",
    tag: "The foundations",
    items: [
      { title: "2023 — Platform founded", text: "Flux is built with a simple thesis: everyone deserves access to institutional real estate." },
      { title: "2024 — First cities live", text: "Karachi and Lahore go live with vetted residential and commercial offerings." },
      { title: "2025 — On-chain ownership", text: "Shares become immutable, verifiable tokens on the Flux Chain." },
    ],
  },
  {
    phase: "Present",
    tag: "Where we are today",
    items: [
      { title: "2026 — Scaling markets", text: "Industrial and logistics assets join the marketplace across new cities and districts." },
    ],
  },
  {
    phase: "Future",
    tag: "What's next",
    items: [
      { title: "New asset classes", text: "Hospitality, farmland and commercial debt — diversified, curated opportunities." },
      { title: "Mobile app", text: "Invest, track distributions and exit from anywhere on iOS and Android." },
      { title: "Full secondary market", text: "Continuous peer-to-peer liquidity with live order books for every asset." },
    ],
  },
];

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <Reveal className="osSectionHead">
      <div className="lnEyebrow">{eyebrow}</div>
      <h2 className="osTitle">{title}</h2>
      {sub && <p className="osSub">{sub}</p>}
    </Reveal>
  );
}

function WhoWeAre() {
  return (
    <section className="osSection" id="story">
      <div className="osSplit">
        <Reveal className="osMedia">
          <Photo src={IMGS.whoWeAre} alt="Modern apartment buildings at golden hour" ratio="4/3" className="osPhoto" />
          <div className="osMediaBadge">
            <div className="osMediaBadgeVal">$480M+</div>
            <div className="osMediaBadgeLabel">in assets listed</div>
          </div>
        </Reveal>
        <div className="osText">
          <Reveal>
            <div className="lnEyebrow">Who we are</div>
            <h2 className="osTitle">Institutional-grade real estate, owned by everyone.</h2>
            <p className="osTextLead">
              Flux is a fractional real estate platform that divides premium income-producing
              properties into affordable digital shares — so anyone can own a piece of the
              world&apos;s most resilient asset class.
            </p>
            <p className="osTextBody">
              Our mission is simple: tear down the barriers that have kept property ownership
              reserved for the few. Every asset on our marketplace is professionally underwritten,
              legally ring-fenced, and managed by on-ground experts — then opened up to investors
              with as little as a single share.
            </p>
          </Reveal>
          <div className="osStatRow">
            {[
              { v: "24K+", l: "Active investors" },
              { v: "8.6%", l: "Avg. annual yield" },
              { v: "3", l: "Asset classes" },
            ].map((s, i) => (
              <Reveal className="osStat" delay={i * 80} key={s.l}>
                <div className="osStatVal">{s.v}</div>
                <div className="osStatLabel">{s.l}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OurPurpose() {
  return (
    <section className="osSection osSectionAlt" id="purpose">
      <div className="osSplit osSplitReverse">
        <div className="osText">
          <Reveal>
            <div className="lnEyebrow">Our purpose</div>
            <h2 className="osTitle">Why Flux exists: the ownership gap.</h2>
            <p className="osTextLead">
              For generations, real estate has been the world&apos;s greatest wealth builder — and the
              least accessible one. We exist to fix four broken realities.
            </p>
          </Reveal>
          <div className="osPurposeList">
            {[
              { t: "High entry barriers", d: "Whole properties cost millions. We break them into shares priced for everyday investors." },
              { t: "Lack of transparency", d: "Traditional deals hide fees and risks. We publish every document, fee and lease." },
              { t: "Illiquidity", d: "A property can tie up capital for decades. Shares trade on our secondary market." },
              { t: "Geographic exclusion", d: "You used to have to live near your asset. Now you can own income property in any city we serve." },
            ].map((p, i) => (
              <Reveal className="osPurposeItem" delay={i * 70} key={p.t}>
                <span className="osPurposeNum">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="osPurposeTitle">{p.t}</div>
                  <div className="osPurposeText">{p.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal className="osMedia">
          <Photo src={IMGS.purpose} alt="City skyline glowing at night" ratio="4/3" className="osPhoto" />
        </Reveal>
      </div>
    </section>
  );
}

function Roadmap() {
  return (
    <section className="osSection" id="roadmap">
      <SectionHead
        eyebrow="Our roadmap"
        title="From first listing to global marketplace"
        sub="A clear, honest path — what we've built, where we are, and where we're headed."
      />
      <div className="osTimeline">
        {TIMELINE.map((group, gi) => (
          <Reveal className="osTimelineGroup" delay={gi * 100} key={group.phase}>
            <div className="osTimelineHead">
              <span className="osPhaseChip">{group.phase}</span>
              <span className="osPhaseTag">{group.tag}</span>
            </div>
            {group.items.map((item) => (
              <div className="osTimelineItem" key={item.title}>
                <span className="osTimelineDot" aria-hidden="true" />
                <div className="osTimelineCard">
                  <div className="osTimelineTitle">{item.title}</div>
                  <div className="osTimelineText">{item.text}</div>
                </div>
              </div>
            ))}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Tracks({ steps, label }: { steps: typeof BUY_STEPS; label: string }) {
  return (
    <Reveal className="osTrack">
      <div className="osTrackHead">
        <span className="osTrackIcon">{label === "Buying" ? "◈" : "⇄"}</span>
        <h3 className="osTrackTitle">{label} a property</h3>
      </div>
      <ol className="osTrackSteps">
        {steps.map((s, i) => (
          <li className="osTrackStep" key={s.title}>
            <span className="osTrackStepIcon">{s.icon}</span>
            <div>
              <div className="osTrackStepTitle">
                <span className="osTrackStepNum">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </div>
              <div className="osTrackStepText">{s.text}</div>
            </div>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

function HowItWorks() {
  return (
    <section className="osSection osSectionAlt" id="how">
      <SectionHead
        eyebrow="Step by step"
        title="Buy or sell — without the friction"
        sub="Two clear paths, each engineered to remove the paperwork, opacity and delays of traditional property deals."
      />
      <div className="osSplit">
        <Reveal className="osMedia">
          <Photo src={IMGS.keys} alt="House keys handed over at closing" ratio="4/3" className="osPhoto" />
          <div className="osMediaBadge osMediaBadgeRight">
            <div className="osMediaBadgeVal">~5 days</div>
            <div className="osMediaBadgeLabel">avg. time to funded</div>
          </div>
        </Reveal>
        <div className="osTracks">
          <Tracks steps={BUY_STEPS} label="Buying" />
          <Tracks steps={SELL_STEPS} label="Selling" />
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="osSection" id="benefits">
      <SectionHead
        eyebrow="Why investors choose Flux"
        title="Own property on your terms"
        sub="The advantages of institutional real estate, rebuilt for the individual investor."
      />
      <div className="osBenefitGrid">
        {BENEFITS.map((b, i) => (
          <Reveal className="osBenefit" delay={(i % 3) * 80} key={b.title}>
            <div className="osBenefitIcon">{b.icon}</div>
            <div className="osBenefitTitle">{b.title}</div>
            <div className="osBenefitText">{b.text}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Terms() {
  return (
    <section className="osSection osSectionAlt" id="terms">
      <div className="osSplit">
        <Reveal className="osMedia">
          <Photo src={IMGS.terms} alt="Signing legal documents with a pen" ratio="4/3" className="osPhoto" />
        </Reveal>
        <div className="osText">
          <Reveal>
            <div className="lnEyebrow">Terms &amp; policies</div>
            <h2 className="osTitle">Clear rules, no fine print traps</h2>
            <p className="osTextLead">
              We keep our terms honest and readable. The essentials are below — the full legal
              documents are always one click away.
            </p>
          </Reveal>
          <div className="osPolicyGrid">
            {POLICIES.map((p, i) => (
              <Reveal className="osPolicy" delay={i * 70} key={p.title}>
                <div className="osPolicyTitle">{p.title}</div>
                <div className="osPolicyText">{p.text}</div>
              </Reveal>
            ))}
          </div>
          <Reveal className="osDocLinks">
            <Link href="/our-story#terms" className="btn btnGhost btnSm">
              Terms &amp; Conditions
            </Link>
            <Link href="/our-story#terms" className="btn btnGhost btnSm">
              Privacy Policy
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Support() {
  return (
    <section className="osSection" id="support">
      <div className="osSplit osSplitReverse">
        <div className="osText">
          <Reveal>
            <div className="lnEyebrow">Customer care</div>
            <h2 className="osTitle">Real humans, real help</h2>
            <p className="osTextLead">
              Whether you&apos;re placing your first order or managing a ten-property portfolio,
              our care team is a message away — and we&apos;re proud of our response times.
            </p>
            <div className="osSupportHours">
              <span>Support hours</span> Mon–Fri, 9am–6pm · Sat, 10am–4pm PKT
            </div>
          </Reveal>
          <div className="osSupportGrid">
            {SUPPORT.map((c, i) => (
              <Reveal className="osSupportCard" delay={i * 80} key={c.title}>
                <div className="osBenefitIcon">{c.icon}</div>
                <div className="osBenefitTitle">{c.title}</div>
                <div className="osBenefitText">{c.text}</div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <Link href="/#faq" className="osFaqLink">
              Browse our FAQs →
            </Link>
          </Reveal>
        </div>
        <Reveal className="osMedia">
          <Photo src={IMGS.support} alt="Friendly support agent assisting a customer" ratio="4/3" className="osPhoto" />
        </Reveal>
      </div>
    </section>
  );
}

function Cta(): ReactNode {
  return (
    <section className="osCta" id="cta">
      <Reveal className="osCtaInner">
        <h2 className="osCtaTitle">Ready to own your first fraction?</h2>
        <p className="osCtaSub">
          Join thousands of investors building wealth in the world&apos;s most resilient asset
          class — or list your property and let the market fund it.
        </p>
        <div className="osCtaActions">
          <Link href="/#properties" className="btn btnPrimary btnLg">
            Invest now →
          </Link>
          <Link href="/#properties" className="btn btnGhost btnLg osCtaGhost">
            List your property
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

export default function OurStory() {
  const { user } = useApp();
  return (
    <div className="landingPage">
      <PublicNav user={user} links={STORY_LINKS} />
      <main>
        <WhoWeAre />
        <OurPurpose />
        <Roadmap />
        <HowItWorks />
        <Benefits />
        <Terms />
        <Support />
        <Cta />
      </main>
      <PublicFooter />
    </div>
  );
}
