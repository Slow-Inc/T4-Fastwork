'use client';

import { SdlcList } from './sdlc-list';
import { useLocale } from '@/i18n/locale-context';

/** Presentational SDLC section — pure, unit-testable. Asymmetric "list in
 * column" layout (Requirement §14.4): a narrow head beside a wide hairline
 * row-list, distinct from the schematic + step-chip pattern right above it. */
export function SdlcSectionView({ en }: { en: boolean }) {
  return (
    <section id="sdlc" className="section">
      <div className="sdlc-wrap">
        <div className="sdlc-head rv">
          <div className="t-idx">06 — SDLC</div>
          <h2>{en ? 'The SDLC we actually run.' : 'SDLC ที่เราใช้จริง'}</h2>
          <p className="t-body">
            {en
              ? 'Not just theory — this is the real Software Development Life Cycle the team runs on every project.'
              : 'ไม่ใช่แค่ทฤษฎี — นี่คือขั้นตอนวิศวกรรมซอฟต์แวร์ (Software Development Life Cycle) ที่ทีมใช้จริงในทุกโปรเจกต์'}
          </p>
        </div>
        <div className="rv">
          <SdlcList en={en} />
        </div>
      </div>
    </section>
  );
}

/** "SDLC" homepage teaser (Requirement §4.6, mirrored from /about) — CTO/technical-founder credibility. */
export function SdlcSection() {
  const { locale } = useLocale();
  return <SdlcSectionView en={locale === 'en'} />;
}
