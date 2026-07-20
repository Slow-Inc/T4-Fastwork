'use client';

import { TrackedLink } from './tracked-link';
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
          {/* button first — the T4 Bot perches on it, so the note reads
              below instead of being covered */}
          <TrackedLink
            href="/contact"
            ctaType="closing-cta"
            className="btn"
            style={{ padding: '13px 22px' }}
          >
            {cta} <span>&rarr;</span>
          </TrackedLink>
          <div className="t-meta" style={{ marginTop: 14 }}>
            {note}
          </div>
        </div>
      </div>
      {/* T4 Bot zone marker — the robot lands on the CTA button, happy
          (requirement3 §14.2.1: appears WITH a function — inviting the hire) */}
      <div
        className="cta-dock"
        data-l4-zone="cta"
        data-l4-scale="0.5"
        data-l4-float="0.18"
        data-l4-perch=".cta .side .btn"
        data-l4-mood="happy"
        aria-hidden
      />
    </section>
  );
}
