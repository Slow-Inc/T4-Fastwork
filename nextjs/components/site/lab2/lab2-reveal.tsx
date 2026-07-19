'use client';

import { useEffect } from 'react';

/**
 * /lab2 micro-motion: reveal any [data-rv] element as it scrolls into view by
 * toggling `.in` (the transition lives in CSS, so it degrades to instant under
 * prefers-reduced-motion). One shared observer, cleaned up on unmount.
 */
export function Lab2Reveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.lab2 [data-rv]'));
    if (!els.length || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
