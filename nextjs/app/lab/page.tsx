import type { Metadata } from 'next';
import { SiteNav } from '@/components/site/site-nav';
import { LabHero } from '@/components/site/lab/lab-hero';
import { LabPreloader } from '@/components/site/lab/lab-preloader';
import { SmoothScroll } from '@/components/site/smooth-scroll';
import { RevealObserver } from '@/components/site/reveal-observer';

export const metadata: Metadata = {
  title: 'Lab — labs-grade hero prototype',
  robots: { index: false, follow: false },
};

/**
 * `/lab` — a self-contained prototype of the ChainGPT-labs-style "wow" hero
 * (kinetic marquee + cursor-reactive 3D + blueprint grid + intro preloader),
 * kept off the live home so it can be reviewed on localhost side-by-side.
 * See `docs/design/chaingpt-teardown.md`.
 */
export default function LabPage() {
  return (
    <>
      <LabPreloader />
      <SiteNav />
      <div className="wrap">
        <LabHero />
      </div>
      <SmoothScroll />
      <RevealObserver />
    </>
  );
}
