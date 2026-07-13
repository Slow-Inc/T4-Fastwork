'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { Project } from '@/content/catalog';
import { useLocale } from '@/i18n/locale-context';

/** Presentational portfolio card (Requirement §4.2), bilingual — pure/testable.
 * Optional `className`/`style` let a list add a reveal/stagger without wrapping. */
export function ProjectCardView({
  project: p,
  en = false,
  className,
  style,
}: {
  project: Project;
  en?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const description = en && p.descriptionEn ? p.descriptionEn : p.description;
  return (
    <article className={`pcard${className ? ` ${className}` : ''}`} style={style}>
      <Link href={`/projects/${p.slug}`} className={`pcard-shot tw t-${p.tone}`}>
        {p.snapshotImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.snapshotImage} alt={p.title} className="pcard-img" />
        ) : (
          <span>{p.title}</span>
        )}
        <div className="pcard-badges">
          {p.isFeatured && <span className="badge badge-accent">{en ? 'Featured' : 'แนะนำ'}</span>}
          <span className="badge">{p.category}</span>
        </div>
      </Link>
      <div className="pcard-body">
        <h3 className="pcard-title">{p.title}</h3>
        <p className="pcard-desc">{description}</p>
        <ul className="pcard-tags">
          {p.tags.map((t) => (
            <li key={t} className="t-meta">
              {t}
            </li>
          ))}
        </ul>
        <div className="pcard-actions">
          <Link href={`/projects/${p.slug}`} className="pcard-link">
            {en ? 'View details' : 'ดูรายละเอียด'}
          </Link>
          {p.liveUrl && (
            <a
              href={p.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pcard-link pcard-link-muted"
            >
              {en ? 'Visit site ↗' : 'ดูเว็บจริง ↗'}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProjectCard({
  project,
  className,
  style,
}: {
  project: Project;
  className?: string;
  style?: CSSProperties;
}) {
  const { locale } = useLocale();
  return (
    <ProjectCardView
      project={project}
      en={locale === 'en'}
      className={className}
      style={style}
    />
  );
}
