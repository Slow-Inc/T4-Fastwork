'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
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
import { ProjectTechnologyPanel } from '@/components/pages/project-technology-panel';
import { EmbeddedProjectChat } from '@/components/pages/embedded-project-chat';
import { useLocale } from '@/i18n/locale-context';

const projectTabs = ['overview', 'deep-detail', 'technology'] as const;
type ProjectTab = (typeof projectTabs)[number];

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
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const contributors = detail
    ? classifyContributors(detail.contributors, detail.pulls, roster)
    : [];
  const ownerLabel =
    p.ownerLabel ?? (p.ownerType === 'personal' ? p.title : 'T4 Labs');

  function askAiAboutThisProject() {
    void trackCtaClick(pathname, 'project-ask-ai-details');
    openChat(p.slug, p.title);
  }

  function selectTab(tab: ProjectTab, focus = false) {
    setActiveTab(tab);
    if (focus) tabRefs.current[projectTabs.indexOf(tab)]?.focus();
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: ProjectTab,
  ) {
    const currentIndex = projectTabs.indexOf(currentTab);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % projectTabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + projectTabs.length) % projectTabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = projectTabs.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    selectTab(projectTabs[nextIndex], true);
  }

  const tabLabels: Record<ProjectTab, string> = {
    overview: t('ภาพรวม', 'Overview'),
    'deep-detail': t('รายละเอียดเชิงลึก', 'Deep detail'),
    technology: t('เทคโนโลยี', 'Technology'),
  };

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

      <div className="project-tabs rv">
        <div
          className="project-tabs__list"
          role="tablist"
          aria-label={t('เนื้อหาโปรเจกต์', 'Project content')}
        >
          {projectTabs.map((tab, index) => (
            <button
              key={tab}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              id={`project-tab-${tab}`}
              className="project-tabs__tab"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`project-panel-${tab}`}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => selectTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
            >
              <span aria-hidden>{String(index + 1).padStart(2, '0')}</span>
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <section
          id="project-panel-overview"
          className="project-tabs__panel"
          role="tabpanel"
          aria-labelledby="project-tab-overview"
          hidden={activeTab !== 'overview'}
          tabIndex={0}
        >
          <div className="detail-grid">
            <div className="detail-content">
              <p>{description}</p>
              {p.liveUrl && (
                <WebsitePreview url={p.liveUrl} title={p.title} en={en} />
              )}
            </div>
            <aside className="detail-meta">
              <div className="meta-block">
                <span className="t-meta">{t('ปี', 'Year')}</span>
                <p>{p.year}</p>
              </div>
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
            </aside>
          </div>
        </section>

        <section
          id="project-panel-deep-detail"
          className="project-tabs__panel"
          role="tabpanel"
          aria-labelledby="project-tab-deep-detail"
          hidden={activeTab !== 'deep-detail'}
          tabIndex={0}
        >
          <div className="detail-content">
            {p.content.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        <section
          id="project-panel-technology"
          className="project-tabs__panel"
          role="tabpanel"
          aria-labelledby="project-tab-technology"
          hidden={activeTab !== 'technology'}
          tabIndex={0}
        >
          <ProjectTechnologyPanel
            technologies={p.technologies}
            tags={p.tags}
            languages={detail?.languages}
            en={en}
          />
        </section>
      </div>

      <EmbeddedProjectChat slug={p.slug} title={p.title} en={en} />

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
