"use client";

import { useEffect } from "react";

/**
 * Animates any `[data-countup]` element's leading number from 0 up to its
 * rendered value when it scrolls into view (ease-out), then leaves the final
 * text in place. Mirrors <RevealObserver>: a null-rendering, client-only
 * enhancement so the components that emit `data-countup` stay pure/SSR-correct.
 * No-JS / reduced-motion / non-numeric text keep the final value untouched.
 */
export function CountUpObserver() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-countup]"),
    );
    if (!els.length || !("IntersectionObserver" in window)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          const m = /^(\d+)(.*)$/.exec(el.textContent ?? "");
          if (!m) continue;
          const target = parseInt(m[1], 10);
          const suffix = m[2];
          const start = performance.now();
          const dur = 900;
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
            el.textContent = Math.round(eased * target) + suffix;
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
