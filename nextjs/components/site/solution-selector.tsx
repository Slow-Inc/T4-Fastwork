'use client';

import Link from 'next/link';
import { solutions, type Solution } from '@/content/solutions';
import { useLocale } from '@/i18n/locale-context';

/** Presentational solution selector — pure, unit-testable. */
export function SolutionSelectorView({
  items,
  en,
}: {
  items: Solution[];
  en: boolean;
}) {
  return (
    <section id="solutions" className="section">
      <div className="sol-grid">
        <div className="sol-title rv">
          <div className="t-idx">01 — Solutions</div>
          <h2>Pick your problem. We speak product.</h2>
          <p className="t-body">
            {en
              ? 'Pick the closest fit and we’ll show you the relevant case studies and approach.'
              : 'เลือกโจทย์ที่ใกล้เคียงที่สุด แล้วเราจะพาไปดูเคสงานและ approach ที่ตรงกับคุณ'}
          </p>
        </div>
        <div className="sol-list rv">
          {items.map((s) => (
            <Link key={s.slug} href={`/recommend/${s.slug}`} className="sol-row">
              <span className="t-meta">{s.code}</span>
              <div>
                <div className="nm">{en ? s.titleEn : s.title}</div>
                <div className="ds t-meta">{en ? s.descriptionEn : s.description}</div>
              </div>
              <span className="go">&rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Homepage Solution Selector (Requirement §4.1.3), bilingual (§7.1). */
export function SolutionSelector() {
  const { locale } = useLocale();
  return <SolutionSelectorView items={solutions} en={locale === 'en'} />;
}
