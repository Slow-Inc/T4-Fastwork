'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * /lab motion controller (Phase 1): drives Lenis smooth scroll off the single
 * GSAP ticker (no second rAF loop) and wires ScrollTrigger, so scroll-scrubbed
 * choreography stays in sync with the smooth scroll. Currently it adds the hero
 * marquee scroll-parallax; further ScrollTrigger choreography hangs off this.
 * Fully disabled under prefers-reduced-motion. Replaces <SmoothScroll/> on /lab
 * only (the live home is untouched). Cleans up ticker/Lenis/triggers on unmount.
 */
export function LabScroll() {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);
    // autoRaf:false — we drive Lenis off the gsap ticker below, so its own rAF
    // loop must be disabled or the two loops fight (stutter + wasted frames).
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, autoRaf: false });
    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // Giant display marquee drifts with scroll (on top of its CSS loop) so the
      // hero reads as scroll-reactive, not just an autonomous ticker.
      gsap.to('.lab-hero-marquee', {
        xPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: '.lab-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    // Recompute trigger geometry once fonts have settled (metrics shift layout);
    // guard so it can't fire after unmount.
    let active = true;
    document.fonts?.ready?.then(() => {
      if (active) ScrollTrigger.refresh();
    });

    return () => {
      active = false;
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33); // restore GSAP default (was global)
      lenis.off('scroll', onScroll);
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  return null;
}
