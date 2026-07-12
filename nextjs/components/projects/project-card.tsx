import Link from 'next/link';
import type { Project } from '@/content/catalog';

/** Portfolio card used on /projects and solution landings (Requirement §4.2). */
export function ProjectCard({ project: p }: { project: Project }) {
  return (
    <article className="pcard">
      <Link href={`/projects/${p.slug}`} className={`pcard-shot tw t-${p.tone}`}>
        <span>{p.title}</span>
        <div className="pcard-badges">
          {p.isFeatured && <span className="badge badge-accent">แนะนำ</span>}
          <span className="badge">{p.category}</span>
        </div>
      </Link>
      <div className="pcard-body">
        <h3 className="pcard-title">{p.title}</h3>
        <p className="pcard-desc">{p.description}</p>
        <ul className="pcard-tags">
          {p.tags.map((t) => (
            <li key={t} className="t-meta">
              {t}
            </li>
          ))}
        </ul>
        <div className="pcard-actions">
          <Link href={`/projects/${p.slug}`} className="pcard-link">
            ดูรายละเอียด
          </Link>
          {p.liveUrl && (
            <a
              href={p.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pcard-link pcard-link-muted"
            >
              ดูเว็บจริง ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
