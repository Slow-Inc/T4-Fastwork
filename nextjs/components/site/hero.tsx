'use client';

import type { ReactNode } from 'react';
import { MetricBand } from './metric-band';
import { TrackedLink } from './tracked-link';
import { useT } from '@/i18n/locale-context';

interface HeroCopy {
  availability: string;
  lead: ReactNode;
  proof: string;
  bookCall: string;
  talkAi: string;
}

/** Presentational hero (takes copy) — pure, unit-testable. */
export function HeroView({ availability, lead, proof, bookCall, talkAi }: HeroCopy) {
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

      <MetricBand />
    </header>
  );
}

/** Homepage hero (Requirement §4.1.2), bilingual (§7.1). */
export function Hero() {
  const copy: HeroCopy = {
    availability: useT('เปิดรับงาน Q3 · 2026', 'Open for Q3 · 2026'),
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
      '— ประสบการณ์ 5 ปี · ส่งมอบแล้ว 500+ โปรเจกต์',
      '— 5 years of experience · 500+ projects shipped',
    ),
    bookCall: useT('นัดคุยโปรเจกต์', 'Book a call'),
    talkAi: useT('คุยกับ AI', 'Talk to our AI'),
  };
  return <HeroView {...copy} />;
}
