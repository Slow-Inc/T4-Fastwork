'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { useFloatingChat } from '@/components/site/floating-chat-context';
import { trackCtaClick } from '@/app/actions/track-cta';
import type { Project } from '@/content/catalog';
import type { RepoDetail } from '@/lib/github';
import {
  classifyContributors,
  type RosterMember,
} from '@/lib/contributors';
import { ReadmeMarkdown } from '@/components/site/readme-markdown';
import { WebsitePreview } from '@/components/site/website-preview';
import { LanguageDonut } from '@/components/site/language-donut';
import { useLocale } from '@/i18n/locale-context';

export function ProjectDetailContent({
  project: p,
  detail,
  roster = [],
}: {
  project: Project;
  /** Live GitHub overlay (spec P6): contributors + README. */
  detail?: RepoDetail | null;
  roster?: RosterMember[];
}) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);
  const description = en && p.descriptionEn ? p.descriptionEn : p.description;
  const pathname = usePathname();
  const { openChat } = useFloatingChat();

  const contributors = detail
    ? classifyContributors(detail.contributors, detail.pulls, roster)
    : [];
  const ownerLabel =
    p.ownerLabel ?? (p.ownerType === 'personal' ? p.title : 'T4 Labs');

  function askAiAboutThisProject() {
    void trackCtaClick(pathname, 'project-ask-ai-details');
    openChat(p.slug, p.title);
  }

  return (
    <article className="section section-page">
      <Breadcrumb
        items={[
          { label: t('หน้าแรก', 'Home'), href: '/' },
          { label: t('ผลงาน', 'Work'), href: '/projects' },
          { label: p.title },
        ]}
      />

      <div className="detail-head rv">
        <div className="t-idx">{p.category}</div>
        <h1>{p.title}</h1>
        <p className="detail-owner">
          <span className={`owner-chip owner-${p.ownerType ?? 'team'}`}>
            {ownerLabel} ·{' '}
            {p.ownerType === 'personal' ? t('ส่วนตัว', 'Personal') : t('ทีม', 'Team')}
          </span>
        </p>
        <p className="page-lead">{description}</p>
      </div>

      <div className={`detail-shot tw t-${p.tone} rv`}>
        {p.snapshotImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.snapshotImage} alt={p.title} className="pcard-img" />
        ) : (
          <span>{p.title}</span>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-content rv">
          {p.content.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <aside className="detail-meta rv">
          <div className="meta-block">
            <span className="t-meta">{t('เทคโนโลยี', 'Technology')}</span>
            <ul className="chip-row">
              {p.technologies.map((tech) => (
                <li key={tech} className="chip">
                  {tech}
                </li>
              ))}
            </ul>
            {detail?.languages && Object.keys(detail.languages).length > 0 && (
              <div className="meta-langs">
                <span className="t-meta">
                  {t('สัดส่วนภาษา', 'Language mix')}
                </span>
                <LanguageDonut languages={detail.languages} en={en} />
              </div>
            )}
          </div>
          <div className="meta-block">
            <span className="t-meta">{t('แท็ก', 'Tags')}</span>
            <ul className="chip-row">
              {p.tags.map((tag) => (
                <li key={tag} className="chip chip-muted">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
          <div className="meta-block">
            <span className="t-meta">{t('ปี', 'Year')}</span>
            <p>{p.year}</p>
          </div>
          {p.liveUrl && (
            <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="btn">
              {t('ดูเว็บจริง ↗', 'Visit site ↗')}
            </a>
          )}
          {p.liveUrl && (
            <WebsitePreview url={p.liveUrl} title={p.title} en={en} />
          )}
          {p.github && (
            <a
              href={`https://github.com/${p.github.owner}/${p.github.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn ghost"
            >
              {t('ดูบน GitHub ↗', 'View on GitHub ↗')}
            </a>
          )}
        </aside>
      </div>

      {contributors.length > 0 && (
        <section className="detail-contributors rv">
          <div className="t-idx">{t('ผู้มีส่วนร่วม', 'Contributors')}</div>
          <ul className="contrib-row">
            {contributors.map((c) => {
              const inner = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.avatarUrl}
                    alt={c.login}
                    className="contrib-avatar"
                    width={40}
                    height={40}
                    loading="lazy"
                  />
                  <span className="contrib-name">{c.login}</span>
                  {c.status === 'pending' && (
                    <span className="contrib-tag pending">
                      {t('ยังไม่ merge', 'pending')}
                    </span>
                  )}
                  {c.membership === 'external' && (
                    <span className="contrib-tag external">
                      {t('นอกทีม', 'external')}
                    </span>
                  )}
                </>
              );
              return (
                <li key={c.login} className="contrib">
                  {c.teamSlug ? (
                    <Link href={`/team/${c.teamSlug}`} className="contrib-link">
                      {inner}
                    </Link>
                  ) : (
                    <a
                      href={c.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contrib-link"
                    >
                      {inner}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {detail?.readme && (
        <section className="detail-readme rv">
          <div className="t-idx">{t('รายละเอียด (README)', 'Details (README)')}</div>
          <ReadmeMarkdown source={detail.readme} />
        </section>
      )}

      <div className="detail-cta rv">
        <button type="button" className="btn" onClick={askAiAboutThisProject}>
          {t('ถามรายละเอียดผลงานนี้กับ AI', 'Ask AI about this project')}
        </button>
        <Link href="/chat" className="btn ghost">
          {t('คุยกับ AI ดูงานคล้ายกัน', 'Ask AI for similar work')}
        </Link>
        <Link href="/contact" className="btn ghost">
          {t('ติดต่อจ้างงาน', 'Hire us')}
        </Link>
      </div>
    </article>
  );
}
