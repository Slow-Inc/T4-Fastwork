'use client';

import Link from 'next/link';
import { useT } from '@/i18n/locale-context';

/** Closing CTA (Requirement §4.1.9), bilingual (§7.1). */
export function CtaSection() {
  const note = useT(
    'เล่าโจทย์ให้เราฟัง — จ้างงานปลอดภัย มีรีวิวคุ้มครองผ่าน Fastwork',
    'Tell us about your project — hire safely with buyer protection via Fastwork.',
  );
  const cta = useT('เริ่มโปรเจกต์', 'Start a project');

  return (
    <section className="cta">
      <div className="cta-grid">
        <h2 className="rv">
          Have a product
          <br />
          in <em>mind?</em>
        </h2>
        <div className="side rv">
          <div className="t-meta" style={{ marginBottom: 14 }}>
            {note}
          </div>
          <Link href="/contact" className="btn" style={{ padding: '13px 22px' }}>
            {cta} <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
