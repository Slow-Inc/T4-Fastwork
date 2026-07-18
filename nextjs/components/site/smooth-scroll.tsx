'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Smooth inertial scroll (labs-grade "motion craft" — the buttery scroll the
 * reference sites all share). Client-only. Fully disabled under
 * prefers-reduced-motion, and torn down on unmount so it never leaks its rAF
 * loop or hijacks scroll on other routes.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let id = 0;
    const raf = (t: number) => {
      lenis.raf(t);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);
  return null;
}
