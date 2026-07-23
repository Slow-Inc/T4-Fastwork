'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trackCtaClick } from '@/app/actions/track-cta';
import { EmbeddedProjectChat } from '@/components/pages/embedded-project-chat';
import {
  ProjectBrief,
  ProjectDetailDisclosures,
} from '@/components/pages/project-detail-sections';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { useFloatingChat } from '@/components/site/floating-chat-context';
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

      <ProjectBrief project={p} detail={detail} en={en} />

      {p.liveUrl && (
        <div className="project-live-preview rv">
          <WebsitePreview url={p.liveUrl} title={p.title} en={en} />
        </div>
      )}

      <ProjectDetailDisclosures
        content={p.content}
        readme={detail?.readme}
        en={en}
      />

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
