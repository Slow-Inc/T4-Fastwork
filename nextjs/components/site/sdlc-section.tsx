'use client';

import { sdlcPhases } from '@/content/site';
import { useLocale } from '@/i18n/locale-context';

/** Presentational SDLC list — pure, unit-testable. */
export function SdlcSectionView({ en }: { en: boolean }) {
  return (
    <section id="sdlc" className="section">
      <div className="proc-head rv">
        <div className="t-idx">06 — SDLC</div>
        <h2>{en ? 'The SDLC we actually run.' : 'SDLC ที่เราใช้จริง'}</h2>
        <p className="t-body">
          {en
            ? 'Not just theory — this is the real Software Development Life Cycle the team runs on every project.'
            : 'ไม่ใช่แค่ทฤษฎี — นี่คือขั้นตอนวิศวกรรมซอฟต์แวร์ (Software Development Life Cycle) ที่ทีมใช้จริงในทุกโปรเจกต์'}
        </p>
      </div>

      <ol className="about-steps rv">
        {sdlcPhases.map((s) => (
          <li key={s.index}>
            <span className="t-idx">{s.index}</span>
            <h3>{en ? s.titleEn : s.title}</h3>
            <p>{en ? s.descriptionEn : s.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** "SDLC" homepage teaser (Requirement §4.6, mirrored from /about) — CTO/technical-founder credibility. */
export function SdlcSection() {
  const { locale } = useLocale();
  return <SdlcSectionView en={locale === 'en'} />;
}
