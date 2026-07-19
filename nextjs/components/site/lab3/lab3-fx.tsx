'use client';

import { useEffect } from 'react';

/**
 * /lab3 behaviour layer, kept to two cheap listeners:
 * - reveal any [data-rv] element as it scrolls into view (transition in CSS,
 *   so prefers-reduced-motion degrades it to instant);
 * - toggle `.scrolled` on the glass nav so its material can react (§14.10).
 */
export function Lab3Fx() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.lab3 [data-rv]'));
    if (!els.length || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('in'));
    } else {
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

      const nav = document.querySelector('.lab3-nav');
      const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        io.disconnect();
        window.removeEventListener('scroll', onScroll);
      };
    }
  }, []);

  return null;
}
