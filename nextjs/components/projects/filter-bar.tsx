import Link from 'next/link';
import type { ProjectFilter } from '@/content/catalog';

export interface Facets {
  categories: string[];
  technologies: string[];
  tags: string[];
}

/**
 * Deep-linkable filter for /projects (Requirement §4.2). A plain GET form so
 * every filter lands in the query string, works without JS, and is shareable.
 */
export function FilterBar({
  facets,
  current,
}: {
  facets: Facets;
  current: ProjectFilter;
}) {
  const featuredHref = current.featured ? '/projects' : '/projects?featured=1';
  return (
    <div className="filterbar rv">
      <div className="filter-tabs">
        <Link
          href="/projects"
          className={`filter-tab${!current.featured ? ' is-active' : ''}`}
        >
          ทั้งหมด
        </Link>
        <Link
          href={featuredHref}
          className={`filter-tab${current.featured ? ' is-active' : ''}`}
        >
          โปรเจกต์แนะนำ
        </Link>
      </div>

      <form method="get" action="/projects" className="filter-form">
        {current.featured && <input type="hidden" name="featured" value="1" />}

        <input
          type="search"
          name="q"
          defaultValue={current.q ?? ''}
          placeholder="ค้นหาผลงาน…"
          className="filter-search"
          aria-label="ค้นหาผลงาน"
        />

        <label className="filter-field">
          <span className="t-meta">หมวดหมู่</span>
          <select name="category" defaultValue={current.category ?? ''}>
            <option value="">ทั้งหมด</option>
            {facets.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span className="t-meta">เทคโนโลยี</span>
          <select name="tech" defaultValue={current.tech ?? ''}>
            <option value="">ทั้งหมด</option>
            {facets.technologies.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span className="t-meta">แท็ก</span>
          <select name="tag" defaultValue={current.tag ?? ''}>
            <option value="">ทั้งหมด</option>
            {facets.tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <div className="filter-actions">
          <button type="submit" className="filter-submit">
            ค้นหา
          </button>
          <Link href="/projects" className="filter-clear t-meta">
            ล้าง
          </Link>
        </div>
      </form>
    </div>
  );
}
