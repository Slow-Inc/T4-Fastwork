'use client';

import Link from 'next/link';
import { useLocale } from '@/i18n/locale-context';

/** Presentational tech stack — pure, unit-testable. */
export function TechStackView({ techs, en }: { techs: string[]; en: boolean }) {
  return (
    <section id="tech" className="section">
      <div className="work-head rv">
        <h2>Tech stack</h2>
        <div style={{ textAlign: 'right' }}>
          <div className="t-idx">05 — Stack</div>
          <div className="t-meta" style={{ marginTop: 6 }}>
            {en ? 'Click to filter work' : 'คลิกเพื่อกรองผลงาน'}
          </div>
        </div>
      </div>
      <div className="tech-chips rv">
        {techs.map((tech) => (
          <Link key={tech} href={`/projects?tech=${tech}`} className="tech-chip">
            {tech}
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Homepage tech-stack section (Requirement §4.1.8): each tag filters /projects. */
export function TechStack({ techs }: { techs: string[] }) {
  const { locale } = useLocale();
  return <TechStackView techs={techs} en={locale === 'en'} />;
}
