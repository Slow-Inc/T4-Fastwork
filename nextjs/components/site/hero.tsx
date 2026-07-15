'use client';

import type { ReactNode } from 'react';
import { MetricBand } from './metric-band';
import { TrackedLink } from './tracked-link';
import { useT } from '@/i18n/locale-context';
import type { Metric } from '@/content/site';

interface HeroCopy {
  availability: string;
  lead: ReactNode;
  proof: string;
  bookCall: string;
  talkAi: string;
  /** Live metric band values (falls back to the static set when absent). */
  metrics?: Metric[];
}

/** Presentational hero (takes copy) — pure, unit-testable. */
export function HeroView({ availability, lead, proof, bookCall, talkAi, metrics }: HeroCopy) {
  return (
    <header>
      <div className="h-top rv">
        <div className="h-avail t-label">
          <i />
          {availability}
        </div>
        <div className="t-meta">Bangkok, TH — Full-Stack + AI</div>
      </div>

      <h1 className="rv">
        We build <em>SaaS</em>, web apps &amp; <em>AI</em> products that scale.
      </h1>

      <div className="h-lower">
        <div className="left rv">
          <p className="t-body">{lead}</p>
        </div>
        <div className="right rv">
          <div className="t-meta">{proof}</div>
          <div className="h-cta">
            <TrackedLink href="/contact" ctaType="hero-book-call" className="btn">
              {bookCall} <span>&rarr;</span>
            </TrackedLink>
            <TrackedLink href="/chat" ctaType="hero-talk-ai" className="btn ghost">
              {talkAi}
            </TrackedLink>
          </div>
        </div>
      </div>

      <MetricBand metrics={metrics} />
    </header>
  );
}

/** Homepage hero (Requirement §4.1.2), bilingual (§7.1). Live stats (years/projects)
 * come from the server so the proof line + metric band track real data. */
export function Hero({
  metrics,
  years = 7,
  projects = 21,
}: {
  metrics?: Metric[];
  years?: number;
  projects?: number;
}) {
  const copy: HeroCopy = {
    availability: useT('เปิดรับงาน Q3 · 2026', 'Open for Q3 · 2026'),
    metrics,
    lead: useT(
      <>
        พาร์ตเนอร์ด้านวิศวกรรมซอฟต์แวร์สำหรับ Founder และองค์กร —{' '}
        <b>ตั้งแต่ Landing Page ไปจนถึงแพลตฟอร์มที่ซับซ้อนสูง</b>{' '}
        เริ่มเล็กแล้วสเกลต่อได้โดยไม่ต้องเปลี่ยนทีม
      </>,
      <>
        A product engineering partner for founders and teams —{' '}
        <b>from a landing page to a high-complexity platform.</b>{' '}
        Start small and scale without switching teams.
      </>,
    ),
    proof: useT(
      `— ประสบการณ์ ${years} ปี · ทำมาแล้ว ${projects}+ โปรเจกต์`,
      `— ${years} years of experience · ${projects}+ projects built`,
    ),
    bookCall: useT('นัดคุยโปรเจกต์', 'Book a call'),
    talkAi: useT('คุยกับ AI', 'Talk to our AI'),
  };
  return <HeroView {...copy} />;
}
