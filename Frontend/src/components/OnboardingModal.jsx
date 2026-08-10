import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

/**
 * OnboardingModal — first-login welcome carousel.
 *
 * Matches the reference style: image on top, centered title + subtitle, an
 * outlined "NEXT" button that becomes a solid "Get Started" CTA on the final
 * slide, pagination dots, a close button, and a blurred dark overlay.
 *
 * Navigation: dots, left/right arrows (desktop), swipe (mobile), keyboard
 * (←/→/Esc). Dismissing via X / Skip / backdrop / Get Started marks the user's
 * onboarding as seen in MongoDB so it never reappears.
 */

const SLIDES = [
  {
    key: "welcome",
    img: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80",
    alt: "City skyline at dusk",
    eyebrow: "Welcome to Flux",
    title: "Own real estate. Fraction by fraction.",
    body: "Invest in premium income-producing properties with as little as one share — no mortgages, no paperwork, no barriers.",
  },
  {
    key: "how",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    alt: "Modern office building",
    eyebrow: "How it works",
    title: "Three steps to your first investment",
    body: "Browse vetted properties → buy shares in fractions → earn rental returns and watch your ownership grow on the Flux Chain.",
    steps: ["Browse properties", "Invest in fractions", "Earn returns"],
  },
  {
    key: "benefits",
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    alt: "Rising bar chart on a desk",
    eyebrow: "Why investors choose Flux",
    title: "Real estate, without the entry fees",
    body: "Diversify across prime assets with a low minimum, passive rental income, full transparency, and liquidity through our secondary market.",
    chips: ["Low minimum", "Diversification", "Passive income", "Transparency"],
  },
  {
    key: "flow",
    img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    alt: "Keys on a property title deed",
    eyebrow: "From request to ownership",
    title: "A transparent buy & sell flow",
    body: "Request shares, get instant approval, and receive a minted ownership token recorded immutably on the Flux Chain.",
    steps: ["Request shares", "Approval", "Ownership token"],
  },
  {
    key: "cta",
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    alt: "Luxury home at dusk",
    eyebrow: "Your portfolio starts today",
    title: "Ready to own your first fraction?",
    body: "Explore the marketplace, pick a property, and become a co-owner in minutes. Your first share is one click away.",
  },
];

const ARROW_LEFT = "←";
const ARROW_RIGHT = "→";

export default function OnboardingModal() {
  const { dismissOnboarding } = useApp();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState(null);
  const [closing, setClosing] = useState(false);
  const last = index === SLIDES.length - 1;
  const dialogRef = useRef(null);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => dismissOnboarding(), 180);
  }, [dismissOnboarding]);

  const goTo = useCallback((i) => {
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)));
  }, []);

  const next = useCallback(() => {
    if (index < SLIDES.length - 1) goTo(index + 1);
  }, [index, goTo]);

  const finish = useCallback(() => {
    close();
    // Route the new investor to the marketplace after the fade-out.
    setTimeout(() => navigate("/discover"), 220);
  }, [close, navigate]);

  // Keyboard navigation + Escape to dismiss. Also move focus into the dialog
  // on open so screen readers and keyboard users start inside the modal.
  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") goTo(index - 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [close, next, goTo, index]);

  // Touch swipe support.
  const onTouchStart = (e) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX == null) return;
    const delta = e.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 48) goTo(index + (delta < 0 ? 1 : -1));
    setTouchX(null);
  };

  return (
    <div
      className={"onbOverlay" + (closing ? " onbClosing" : "")}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Flux"
    >
      <div
        className="onbModal"
        ref={dialogRef}
        tabIndex={-1}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button className="onbClose" onClick={close} aria-label="Close welcome">
          ✕
        </button>

        <div className="onbViewport">
          <div
            className="onbTrack"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((s, i) => (
              <section
                key={s.key}
                className="onbSlide"
                aria-hidden={i !== index}
              >
                <div className="onbMedia">
                  <img
                    src={s.img}
                    alt={s.alt}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <div className="onbMediaShade" aria-hidden="true" />
                </div>

                <div className="onbBody">
                  <div className="onbEyebrow">{s.eyebrow}</div>
                  <h2 className="onbTitle">{s.title}</h2>
                  <p className="onbText">{s.body}</p>

                  {s.steps && (
                    <ol className="onbSteps">
                      {s.steps.map((step, si) => (
                        <li key={step}>
                          <span className="onbStepNum">{si + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  )}

                  {s.chips && (
                    <div className="onbChips">
                      {s.chips.map((c) => (
                        <span key={c} className="onbChip">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="onbFoot">
          <div className="onbDots" aria-label="Slide position">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={"onbDot" + (i === index ? " onbDotActive" : "")}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>

          <div className="onbActions">
            <button className="onbSkip" onClick={close}>
              Skip
            </button>

            {index > 0 && (
              <button
                className="onbArrow"
                onClick={() => goTo(index - 1)}
                aria-label="Previous slide"
              >
                {ARROW_LEFT}
              </button>
            )}

            {last ? (
              <button className="btn btnPrimary onbNext" onClick={finish} autoFocus>
                Get Started →
              </button>
            ) : (
              <button className="btn btnSoft onbNext" onClick={next}>
                NEXT {ARROW_RIGHT}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
