'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/site/breadcrumb';
import type { Project } from '@/content/catalog';
import { useLocale } from '@/i18n/locale-context';

export function ProjectDetailContent({ project: p }: { project: Project }) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);
  const description = en && p.descriptionEn ? p.descriptionEn : p.description;

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
        </aside>
      </div>

      <div className="detail-cta rv">
        <Link href="/chat" className="btn">
          {t('คุยกับ AI ดูงานคล้ายกัน', 'Ask AI for similar work')}
        </Link>
        <Link href="/contact" className="btn ghost">
          {t('ติดต่อจ้างงาน', 'Hire us')}
        </Link>
      </div>
    </article>
  );
}
