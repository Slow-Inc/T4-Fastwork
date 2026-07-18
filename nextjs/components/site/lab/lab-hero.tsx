'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/locale-context';
import { KineticMarquee } from './kinetic-marquee';
import { BlueprintGrid } from './blueprint-grid';
import { LabHeroSceneLazy } from './lab-hero-scene-lazy';

interface LabHeroCopy {
  headline: ReactNode;
  lead: ReactNode;
  cta: string;
  techs: string[];
}

/** Presentational hero copy — pure, unit-testable (the single semantic <h1>,
 *  the lead, the CTA, the stack strip). No 3D/marquee here, mirroring HeroView. */
export function LabHeroView({ headline, lead, cta, techs }: LabHeroCopy) {
  return (
    <div className="lab-hero-copy rv">
      <h1 className="lab-hero-h1">{headline}</h1>
      <p className="lab-hero-lead t-body">{lead}</p>
      <div className="lab-hero-cta">
        <Link href="/contact" className="btn">
          {cta} <span aria-hidden>&rarr;</span>
        </Link>
      </div>
      <ul className="lab-tech-strip" aria-label="stack">
        {techs.map((t) => (
          <li key={t} className="lab-tech-item">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Labs-grade hero prototype (ChainGPT teardown → T4): a kinetic display marquee
 *  behind a cursor-reactive 3D form, framed by a blueprint grid. The 3D + marquee
 *  live on the wrapper (out of the pure, tested contract), like the real Hero. */
export function LabHero() {
  const copy: LabHeroCopy = {
    headline: useT(
      <>
        เราสร้าง <em>ซอฟต์แวร์</em> ที่สเกลได้จริง
      </>,
      <>
        We build <em>software</em> that scales
      </>,
    ),
    lead: useT(
      <>
        พาร์ตเนอร์ด้านวิศวกรรมซอฟต์แวร์สำหรับ Founder และองค์กร —{' '}
        <b>ตั้งแต่ Landing Page ไปจนถึงแพลตฟอร์มที่ซับซ้อนสูง</b>
      </>,
      <>
        A product engineering partner for founders and teams —{' '}
        <b>from a landing page to a high-complexity platform.</b>
      </>,
    ),
    cta: useT('นัดคุยโปรเจกต์', 'Book a call'),
    techs: ['Next.js', 'Nest.js', 'Supabase', 'TypeScript', 'AI · RAG'],
  };
  return (
    <div className="lab-hero">
      <BlueprintGrid />
      <div className="lab-hero-marquee">
        <KineticMarquee text="BUILDING TOMORROW —" />
      </div>
      <div className="lab-hero-scene">
        <LabHeroSceneLazy />
      </div>
      <LabHeroView {...copy} />
    </div>
  );
}
