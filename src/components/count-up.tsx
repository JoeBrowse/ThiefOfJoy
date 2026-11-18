"use client";

import { useEffect, useState } from "react";

/** Animated number for the score reveal. Respects reduced motion. */
export function CountUp({ value, duration = 1600, decimals = 1 }: { value: number; duration?: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const start = performance.now() - (reduced ? duration : 0);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display.toFixed(decimals)}</>;
}
