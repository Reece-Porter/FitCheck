"use client";

import { useState, useEffect } from "react";
import { safeImageSrc } from "@/lib/format";
import { thumbUrl } from "@/lib/thumb";

/* Renders an item photo as a resized thumbnail, falling back to the original
   image if the resizer fails, then to `fallback` (a placeholder) if that fails
   too. Data-URL images (already small) are shown as-is. */
export default function SmartImage({
  src,
  alt,
  width = 600,
  fallback
}: {
  src: string;
  alt: string;
  width?: number;
  fallback: React.ReactNode;
}) {
  const original = safeImageSrc(src);
  const isData = /^data:/i.test(original);
  // stage 0 = thumbnail, 1 = original, 2 = failed
  const [stage, setStage] = useState<0 | 1 | 2>(original ? 0 : 2);

  useEffect(() => {
    setStage(original ? 0 : 2);
  }, [original]);

  if (!original || stage === 2) return <>{fallback}</>;

  const useThumb = stage === 0 && !isData;
  const url = useThumb ? thumbUrl(original, width) : original;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setStage((s) => (s === 0 && !isData ? 1 : 2))}
    />
  );
}
