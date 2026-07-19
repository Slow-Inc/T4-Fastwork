import type { Metadata } from 'next';
import { SiteNav } from '@/components/site/site-nav';
import { LabPreloader } from '@/components/site/lab/lab-preloader';
import { LabHero } from '@/components/site/lab/lab-hero';
import { LabCapabilities } from '@/components/site/lab/lab-capabilities';
import { LabHowWeWork } from '@/components/site/lab/lab-how-we-work';
import { LabSelectedWork } from '@/components/site/lab/lab-selected-work';
import { LabStats } from '@/components/site/lab/lab-stats';
import { LabFaqSection } from '@/components/site/lab/lab-faq-section';
import { LabDrenchCta } from '@/components/site/lab/lab-drench-cta';
import { LabFooter } from '@/components/site/lab/lab-footer';
import { LabScroll } from '@/components/site/lab/lab-scroll';
import { RevealObserver } from '@/components/site/reveal-observer';

export const metadata: Metadata = {
  title: 'Lab — labs-grade long-page prototype',
  robots: { index: false, follow: false },
};

/**
 * `/lab` — a full long-scroll prototype in the ChainGPT-labs idiom (kinetic
 * hero + capabilities + process node-flow + selected work + stats + FAQ + a
 * color-drench CTA + big-wordmark footer), kept off the live home so it can be
 * reviewed on localhost. See `docs/design/chaingpt-teardown.md`.
 */
export default function LabPage() {
  return (
    <>
      <LabPreloader />
      <SiteNav />
      <main>
        <div className="wrap">
          <LabHero />
          <LabCapabilities />
          <LabHowWeWork />
          <LabSelectedWork />
          <LabStats />
          <LabFaqSection />
        </div>
        <LabDrenchCta />
      </main>
      <LabFooter />
      <LabScroll />
      <RevealObserver />
    </>
  );
}
