'use client';

import { skills, education } from '@/content/site';
import { useLocale } from '@/i18n/locale-context';

/** Presentational skills + education — pure, unit-testable. */
export function SkillsSectionView({ en }: { en: boolean }) {
  return (
    <section id="skills" className="section">
      <div className="proc-head rv">
        <div className="t-idx">07 — Skills</div>
        <h2>{en ? 'What the team builds with.' : 'ความสามารถของทีม'}</h2>
      </div>

      <ul className="skill-chips rv">
        {skills.map((s) => {
          const levelLabel =
            s.level === 'expert'
              ? en
                ? 'expert level'
                : 'ระดับเชี่ยวชาญ'
              : en
                ? 'intermediate level'
                : 'ระดับปานกลาง';
          return (
            <li
              key={s.name}
              className="skill-chip"
              data-level={s.level}
              title={s.detail ?? undefined}
              aria-label={`${s.name}${s.detail ? ` — ${s.detail}` : ''} (${levelLabel})`}
            >
              <span className="skill-dot" aria-hidden="true" />
              {s.name}
            </li>
          );
        })}
      </ul>

      <div className="edu-block rv">
        <span className="t-idx">{en ? 'Education' : 'การศึกษา'}</span>
        <ul className="edu-list">
          {education.map((e) => (
            <li key={`${e.program}-${e.institution}`}>
              <span>{e.program}</span>
              <span className="t-meta">{e.institution}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Homepage/About "Skills" (Requirement §4.6 — synced with the team's Fastwork profile). */
export function SkillsSection() {
  const { locale } = useLocale();
  return <SkillsSectionView en={locale === 'en'} />;
}
