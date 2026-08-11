"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
}

/**
 * Reveal — fades/slides children into view the first time they scroll on screen.
 * Usage: <Reveal delay={120}>...</Reveal>
 */
export default function Reveal({ children, delay = 0, className = "", as = "div" }: RevealProps) {
  const Tag = as;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "revealIn" : ""} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
