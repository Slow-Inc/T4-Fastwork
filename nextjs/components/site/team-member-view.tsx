import type { TeamMember, TeamCertificate } from '@/content/site';
import type { LiveRepo, LiveUser } from '@/lib/github';
import { TechChips } from './tech-chips';
import { MarkdownContent } from '@/lib/markdown';
import { staggerDelay } from '@/lib/stagger';

/**
 * Presentational profile for one team member — pure and unit-testable (no hooks).
 * The certificate cards call `onOpenCert` when provided (the client wrapper opens a
 * lightbox); without it they degrade to plain download links, so this view renders
 * fine in tests and even without JS.
 */
export function TeamMemberView({
  member,
  en,
  onOpenCert,
  liveRepos,
  liveUser,
}: {
  member: TeamMember;
  en: boolean;
  onOpenCert?: (cert: TeamCertificate) => void;
  /** Live GitHub repos (ADR 0003); overlays star counts when present, else absent. */
  liveRepos?: LiveRepo[] | null;
  /** Live GitHub identity (spec P7): real avatar + profile README. */
  liveUser?: LiveUser | null;
}) {
  const initial = member.handle.replace(/^_/, '').charAt(0).toUpperCase();
  const starsByUrl = new Map(
    (liveRepos ?? []).map((r) => [r.html_url, r.stargazers_count] as const),
  );
  return (
    <article className="tm">
      {/* 01 — Hero band */}
      <header className="tm-hero rv">
        <div className="t-idx">01 — {en ? 'Profile' : 'โปรไฟล์'}</div>
        <div className="tm-hero-row">
          {liveUser?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="tm-avatar tm-avatar-img"
              src={liveUser.avatarUrl}
              alt={`${member.handle} GitHub avatar`}
              width={72}
              height={72}
              loading="lazy"
            />
          ) : (
            <span className="tm-avatar" aria-hidden="true">
              {initial}
            </span>
          )}
          <div>
            <h1>{member.handle}</h1>
            <p className="tm-role">{en ? member.roleEn : member.role}</p>
            {member.education && (
              <p className="t-meta tm-edu">
                {member.education.program} — {member.education.institution}
              </p>
            )}
            {member.githubUrl && (
              <a
                className="tm-gh"
                href={member.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {member.githubUrl.replace('https://', '')}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* GitHub profile README (spec P7) — native rendering when present */}
      {liveUser?.profileReadme && (
        <section className="tm-block rv tm-readme">
          <div className="t-idx">
            {en ? 'GitHub profile' : 'โปรไฟล์ GitHub'}
          </div>
          <MarkdownContent source={liveUser.profileReadme} />
        </section>
      )}

      {/* 02 — Skills */}
      <section className="tm-block rv">
        <div className="t-idx">02 — Skills</div>
        <ul className="chip-row">
          {member.skills.map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
      </section>

      {/* 03 — Tech stack */}
      {member.stack && member.stack.length > 0 && (
        <section className="tm-block rv">
          <div className="t-idx">03 — {en ? 'Tech stack' : 'เทคโนโลยีที่ใช้'}</div>
          <TechChips items={member.stack} />
        </section>
      )}

      {/* 04 — Projects (real repos) */}
      {member.projects && member.projects.length > 0 && (
        <section className="tm-block rv">
          <div className="t-idx">04 — {en ? 'Projects' : 'ผลงาน'}</div>
          <ol className="tm-projects">
            {member.projects.map((p, i) => (
              <li
                key={p.url}
                className="tm-proj rv rv-down"
                style={{ transitionDelay: staggerDelay(i) }}
              >
                <span className="tm-proj-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="tm-proj-body">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="tm-proj-name">
                    {p.name}
                    <span className="tm-proj-year">{p.year}</span>
                    {starsByUrl.has(p.url) && (
                      <span className="tm-proj-stars" aria-label="GitHub stars">
                        ★ {starsByUrl.get(p.url)}
                      </span>
                    )}
                  </a>
                  {p.description && <p className="tm-proj-desc">{p.description}</p>}
                  <ul className="chip-row tm-proj-tech">
                    {p.tech.map((t) => (
                      <li key={t} className="chip chip-muted">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 05 — Certificates */}
      {member.certificates && member.certificates.length > 0 && (
        <section className="tm-block rv">
          <div className="t-idx">05 — {en ? 'Certificates' : 'ใบรับรอง'}</div>
          <ul className="tm-certs">
            {member.certificates.map((c, i) => (
              <li
                key={`${c.issuer}-${c.title}`}
                className="tm-cert rv rv-down"
                style={{ transitionDelay: staggerDelay(i) }}
              >
                {c.asset ? (
                  onOpenCert ? (
                    <button
                      type="button"
                      className="tm-cert-open"
                      onClick={() => onOpenCert(c)}
                      aria-label={`${en ? 'View certificate' : 'ดูใบรับรอง'}: ${c.title}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.asset.webp} alt={`${c.title} — ${c.issuer}`} loading="lazy" />
                    </button>
                  ) : (
                    <a
                      className="tm-cert-open"
                      href={c.asset.pdf ?? c.asset.img ?? c.asset.webp}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.asset.webp} alt={`${c.title} — ${c.issuer}`} loading="lazy" />
                    </a>
                  )
                ) : null}
                <div className="tm-cert-meta">
                  <span className="t-meta">{c.issuer}</span>
                  <span className="tm-cert-title">{c.title}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
