'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trackCtaClick } from '@/app/actions/track-cta';
import { EmbeddedProjectChat } from '@/components/pages/embedded-project-chat';
import { ProjectTechnologyPanel } from '@/components/pages/project-technology-panel';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { useFloatingChat } from '@/components/site/floating-chat-context';
import { ReadmeMarkdown } from '@/components/site/readme-markdown';
import { WebsitePreview } from '@/components/site/website-preview';
import type { Project } from '@/content/catalog';
import { useLocale } from '@/i18n/locale-context';
import {
  classifyContributors,
  type RosterMember,
} from '@/lib/contributors';
import type { RepoDetail } from '@/lib/github';

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
            {p.ownerType === 'personal'
              ? t('ส่วนตัว', 'Personal')
              : t('ทีม', 'Team')}
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

      <section
        className="project-brief rv"
        aria-labelledby="project-summary-heading"
      >
        <div className="project-brief__summary">
          <div className="project-brief__eyebrow">
            <span className="t-idx">{t('ภาพรวม', 'Overview')}</span>
            <span>{t('อ่านจบใน 30 วินาที', 'A 30-second read')}</span>
          </div>
          <h2 id="project-summary-heading">
            {t('สรุปโปรเจกต์', 'Project summary')}
          </h2>
          <p className="project-brief__lead">{description}</p>

          <dl className="project-facts">
            <div>
              <dt>{t('หมวดหมู่', 'Category')}</dt>
              <dd>{p.category}</dd>
            </div>
            <div>
              <dt>{t('ปี', 'Year')}</dt>
              <dd>{p.year}</dd>
            </div>
            <div>
              <dt>{t('ผู้ดูแลผลงาน', 'Ownership')}</dt>
              <dd>{ownerLabel}</dd>
            </div>
          </dl>

          <div className="project-brief__links">
            {p.liveUrl && (
              <a
                href={p.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
              >
                {t('ดูเว็บจริง ↗', 'Visit site ↗')}
              </a>
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
          </div>
        </div>

        <aside
          className="project-brief__technology"
          aria-label={t('ข้อมูลทางเทคนิค', 'Technical profile')}
        >
          <div className="project-brief__technical-heading">
            <span className="t-idx">
              {t('ข้อมูลทางเทคนิค', 'Technical profile')}
            </span>
            <span>{t('ข้อมูลจากโปรเจกต์และ GitHub', 'Project + GitHub data')}</span>
          </div>
          <ProjectTechnologyPanel
            technologies={p.technologies}
            tags={p.tags}
            languages={detail?.languages}
            en={en}
          />
        </aside>
      </section>

      {p.liveUrl && (
        <div className="project-live-preview rv">
          <WebsitePreview url={p.liveUrl} title={p.title} en={en} />
        </div>
      )}

      <details className="project-disclosure rv">
        <summary>
          <span>
            <span className="t-idx">
              {t('รายละเอียดเพิ่มเติม', 'More detail')}
            </span>
            <strong>{t('รายละเอียดเชิงลึก', 'Deep detail')}</strong>
          </span>
          <span className="project-disclosure__hint" aria-hidden="true">
            <span className="project-disclosure__when-closed">
              {t('เปิดอ่าน', 'Open')}
            </span>
            <span className="project-disclosure__when-open">
              {t('ปิด', 'Close')}
            </span>
          </span>
        </summary>
        <div className="detail-content">
          {p.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </details>

      <EmbeddedProjectChat slug={p.slug} title={p.title} en={en} />

      {contributors.length > 0 && (
        <section className="detail-contributors rv">
          <div className="t-idx">{t('ผู้มีส่วนร่วม', 'Contributors')}</div>
          <ul className="contrib-row">
            {contributors.map((contributor) => {
              const inner = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={contributor.avatarUrl}
                    alt={contributor.login}
                    className="contrib-avatar"
                    width={40}
                    height={40}
                    loading="lazy"
                  />
                  <span className="contrib-name">{contributor.login}</span>
                  {contributor.status === 'pending' && (
                    <span className="contrib-tag pending">
                      {t('ยังไม่ merge', 'pending')}
                    </span>
                  )}
                  {contributor.membership === 'external' && (
                    <span className="contrib-tag external">
                      {t('นอกทีม', 'external')}
                    </span>
                  )}
                </>
              );

              return (
                <li key={contributor.login} className="contrib">
                  {contributor.teamSlug ? (
                    <Link
                      href={`/team/${contributor.teamSlug}`}
                      className="contrib-link"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <a
                      href={contributor.htmlUrl}
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
        <details className="detail-readme project-disclosure rv">
          <summary>
            <span>
              <span className="t-idx">{t('เอกสารต้นฉบับ', 'Source document')}</span>
              <strong>{t('รายละเอียด (README)', 'Details (README)')}</strong>
            </span>
            <span className="project-disclosure__hint" aria-hidden="true">
              <span className="project-disclosure__when-closed">
                {t('เปิดอ่าน', 'Open')}
              </span>
              <span className="project-disclosure__when-open">
                {t('ปิด', 'Close')}
              </span>
            </span>
          </summary>
          <ReadmeMarkdown source={detail.readme} />
        </details>
      )}

      <div className="detail-cta rv">
        <button type="button" className="btn" onClick={askAiAboutThisProject}>
          {t('ถามรายละเอียดผลงานนี้กับ AI', 'Ask AI about project')}
        </button>
        <Link href="/chat" className="btn ghost">
          {t('คุยกับ AI ดูงานคล้ายกัน', 'Ask AI about similar work')}
        </Link>
        <Link href="/contact" className="btn ghost">
          {t('ติดต่อจ้างงาน', 'Hire us')}
        </Link>
      </div>
    </article>
  );
}
