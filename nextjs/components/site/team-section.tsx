'use client';

import { team } from '@/content/site';
import { useLocale } from '@/i18n/locale-context';

/** Presentational team roster — pure, unit-testable. */
export function TeamSectionView({ en }: { en: boolean }) {
  return (
    <section id="team" className="section">
      <div className="proc-head rv">
        <div className="t-idx">07 — Team</div>
        <h2>{en ? 'The people building it.' : 'ทีมที่ลงมือสร้างจริง'}</h2>
        <p className="t-body">
          {en
            ? "Six people, each doing their own real work — not a faceless agency."
            : 'ทีม 6 คน แต่ละคนทำงานจริงตามความถนัดของตัวเอง — ไม่ใช่เอเจนซี่ที่ไม่มีตัวตน'}
        </p>
      </div>

      <div className="team-grid rv">
        {team.map((m) => (
          <div key={m.handle} className="team-card">
            <div className="team-head">
              <span className="team-avatar" aria-hidden="true">
                {m.handle.replace(/^_/, '').charAt(0).toUpperCase()}
              </span>
              <div>
                <h3>
                  {m.githubUrl ? (
                    <a href={m.githubUrl} target="_blank" rel="noopener noreferrer">
                      {m.handle}
                    </a>
                  ) : (
                    m.handle
                  )}
                </h3>
                <p className="t-meta">{en ? m.roleEn : m.role}</p>
              </div>
            </div>

            <ul className="chip-row">
              {m.skills.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>

            {m.stack && m.stack.length > 0 && (
              <ul className="chip-row team-stack">
                {m.stack.map((s) => (
                  <li key={s} className="chip chip-muted">
                    {s}
                  </li>
                ))}
              </ul>
            )}

            {m.education && (
              <p className="team-edu t-meta">
                {m.education.program} — {m.education.institution}
              </p>
            )}

            {m.certificates && m.certificates.length > 0 && (
              <ul className="team-certs">
                {m.certificates.map((c) => (
                  <li key={`${c.issuer}-${c.title}`}>
                    <span className="t-meta">{c.issuer}</span> {c.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/** /about "Team" (Requirement §4.6) — real roster from github.com/Slow-Inc. */
export function TeamSection() {
  const { locale } = useLocale();
  return <TeamSectionView en={locale === 'en'} />;
}
