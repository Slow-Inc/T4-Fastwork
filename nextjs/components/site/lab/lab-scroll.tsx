'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

/**
 * /lab motion controller (Phase 1): Lenis smooth scroll driven off the single
 * GSAP ticker (autoRaf:false so the loops don't fight), plus the visible GSAP
 * choreography — hero marquee scroll-parallax, a line-mask reveal on every big
 * heading (script-safe, works for Thai + EN by line), and a ScrambleText reveal
 * on the Latin tech chips. Fully disabled under prefers-reduced-motion (base
 * markup stays visible). Replaces <SmoothScroll/> on /lab only. Cleans up the
 * ticker, Lenis, SplitText instances and triggers on unmount.
 */
export function LabScroll() {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, autoRaf: false });
    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const splits: SplitText[] = [];

    const build = () => {
      const ctx = gsap.context(() => {
        // Giant display marquee drifts with scroll.
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

        // Line-mask reveal on every big heading (per line, so Thai + EN both work).
        gsap.utils.toArray<HTMLElement>('.lab-hero-h1, .lab-sec-title').forEach((el) => {
          const split = new SplitText(el, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'lab-line',
          });
          splits.push(split);
          gsap.from(split.lines, {
            yPercent: 115,
            autoAlpha: 0,
            duration: 0.9,
            stagger: 0.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        });

        // ScrambleText the (always-Latin) stack chips as the hero enters.
        gsap.utils.toArray<HTMLElement>('.lab-tech-item').forEach((el, i) => {
          const text = el.textContent || '';
          gsap.from(el, {
            autoAlpha: 0,
            duration: 0.3,
            delay: i * 0.06,
            scrollTrigger: { trigger: '.lab-hero', start: 'top 70%', once: true },
          });
          gsap.to(el, {
            duration: 1.0,
            delay: 0.3 + i * 0.08,
            ease: 'none',
            scrambleText: { text, chars: 'upperCase', speed: 0.6 },
            scrollTrigger: { trigger: '.lab-hero', start: 'top 70%', once: true },
          });
        });
      });
      return ctx;
    };

    // Build after fonts settle so SplitText measures final glyph metrics.
    let active = true;
    let ctx: gsap.Context | undefined;
    const start = () => {
      if (!active) return;
      ctx = build();
      ScrollTrigger.refresh();
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(start);
    } else {
      start();
    }

    return () => {
      active = false;
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.off('scroll', onScroll);
      lenis.destroy();
      splits.forEach((s) => s.revert());
      ctx?.revert();
    };
  }, []);

  return null;
}
