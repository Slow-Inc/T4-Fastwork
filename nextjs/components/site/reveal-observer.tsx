'use client';

import { useEffect } from 'react';

/**
 * Adds the `.in` class to every `.rv` element as it scrolls into view
 * (section-level reveal). Respects prefers-reduced-motion via CSS. Client-only.
 */
export function RevealObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.rv'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    // threshold 0 (any edge touching the viewport), NOT a ratio: a ratio like
    // 0.14 is unsatisfiable for any `.rv` taller than ~7× the viewport (e.g. the
    // /projects grid at 54 cards ≈ 7900px), so it would stay opacity:0 forever.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
