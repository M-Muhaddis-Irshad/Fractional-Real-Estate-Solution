"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";

interface PhotoProps {
  src?: string;
  alt?: string;
  className?: string;
  ratio?: string;
  eager?: boolean;
}

/**
 * Photo — responsive image with shimmer skeleton, lazy loading, crossfade-in
 * and a graceful branded fallback if the source is missing or fails.
 * Usage: <Photo src="…" alt="…" ratio="4/3" />
 */
export default function Photo({ src, alt = "", className = "", ratio, eager = false }: PhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const showImage = Boolean(src) && !error;
  const showFallback = !src || error;

  return (
    <div
      className={`photo ${loaded ? "photoLoaded" : ""} ${className}`.trim()}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {showFallback && (
        <div className="photoFallback" aria-hidden="true">
          <Building2 size={30} />
        </div>
      )}
      {!showFallback && !loaded && <div className="photoShimmer" aria-hidden="true" />}
      {showImage && (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
