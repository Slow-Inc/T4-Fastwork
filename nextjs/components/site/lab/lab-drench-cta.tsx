'use client';

import Link from 'next/link';
import { useT } from '@/i18n/locale-context';

/** Full-bleed orange color-drench CTA — the one bold block that breaks the light
 *  ground so the page is memorable (the ChainGPT "WE BACK BUILDERS" move). */
export function LabDrenchCta() {
  return (
    <section className="lab-drench">
      <div className="lab-drench-inner rv">
        <span className="lab-drench-kicker">{useT('พร้อมเริ่มแล้ว', 'Ready when you are')}</span>
        <h2 className="lab-drench-title">
          {useT(<>มาสร้างของจริงกัน</>, <>Let&rsquo;s build something real</>)}
        </h2>
        <p className="lab-drench-lead">
          {useT(
            'เล่าโปรเจกต์ให้เราฟัง แล้วเราจะบอกทางที่เร็วและคุ้มที่สุด',
            'Tell us about your project — we’ll map the fastest, soundest path.',
          )}
        </p>
        <div className="lab-drench-cta">
          <Link href="/contact" className="btn lab-drench-btn">
            {useT('นัดคุยโปรเจกต์', 'Book a call')} <span aria-hidden>&rarr;</span>
          </Link>
          <Link href="/chat" className="btn ghost lab-drench-btn2">
            {useT('คุยกับ AI', 'Talk to our AI')}
          </Link>
        </div>
      </div>
    </section>
  );
}
