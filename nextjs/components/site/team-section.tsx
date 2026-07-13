'use client';

import Link from 'next/link';
import { team, teamProjects } from '@/content/site';
import { useLocale } from '@/i18n/locale-context';

/** Presentational team roster — pure, unit-testable. A directory (not a card grid) so
 * this section reads structurally different from the rest of /about (Requirement §14.4). */
export function TeamSectionView({ en }: { en: boolean }) {
  return (
    <section id="team" className="section">
      <div className="proc-head rv">
        <div className="t-idx">07 — Team</div>
        <h2>{en ? 'The people building it.' : 'ทีมที่ลงมือสร้างจริง'}</h2>
        <p className="t-body">
          {en
            ? 'Six people, each doing their own real work — open a profile for their projects and certificates.'
            : 'ทีม 6 คน แต่ละคนทำงานจริงตามความถนัด — กดเข้าไปดูผลงานและใบรับรองรายคนได้'}
        </p>
      </div>

      <ul className="team-dir rv">
        {team.map((m, i) => (
          <li key={m.handle} className="team-dir-item">
            <Link href={`/team/${m.slug}`} className="team-dir-row">
              <span className="team-dir-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="team-dir-handle">{m.handle}</span>
              <span className="team-dir-role t-meta">{en ? m.roleEn : m.role}</span>
              <span className="team-dir-skills">{m.skills.join(' · ')}</span>
              <span className="team-dir-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="team-projects rv">
        <div className="t-idx">{en ? 'Team projects' : 'งานที่ทำร่วมกันเป็นทีม'}</div>
        <ul className="team-proj-list">
          {teamProjects.map((p) => (
            <li key={p.url} className="team-proj">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="team-proj-name">
                {p.name}
                <span className="team-proj-year">{p.year}</span>
              </a>
              {p.description && <p className="team-proj-desc t-meta">{p.description}</p>}
              <div className="team-proj-foot">
                <span className="team-proj-contrib t-meta">
                  {en ? 'by' : 'โดย'} {p.contributors.join(', ')}
                </span>
                <span className="team-proj-tech t-meta">{p.tech.join(' · ')}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** /about "Team" (Requirement §4.6) — real roster from github.com/Slow-Inc. */
export function TeamSection() {
  const { locale } = useLocale();
  return <TeamSectionView en={locale === 'en'} />;
}
