import type { Project } from '@/content/catalog';

/**
 * Pure mapping between the DB projects row shape and the Project view model
 * (Requirement §10). Kept free of server-only imports so it is unit-testable.
 */

const TONES: Project['tone'][] = ['ink', 'sand', 'teal', 'gray'];

/** Deterministic tone for a slug (DB rows have no tone column). */
export function toneForSlug(slug: string): Project['tone'] {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return TONES[hash % TONES.length];
}

export interface DbProjectRow {
  slug: string;
  title: string;
  title_en: string | null;
  description: string | null;
  content: string | null;
  live_url: string | null;
  is_featured: boolean;
  published_at: string | null;
  category: { name: string } | null;
  project_technologies: { technologies: { name: string } | null }[];
  project_tags: { tags: { name: string } | null }[];
}

export function mapDbProject(row: DbProjectRow): Project {
  return {
    slug: row.slug,
    title: row.title,
    titleEn: row.title_en ?? row.title,
    description: row.description ?? '',
    content: row.content ? row.content.split('\n\n').filter(Boolean) : [],
    category: row.category?.name ?? '',
    tags: (row.project_tags ?? [])
      .map((t) => t.tags?.name)
      .filter((n): n is string => Boolean(n)),
    technologies: (row.project_technologies ?? [])
      .map((t) => t.technologies?.name)
      .filter((n): n is string => Boolean(n)),
    liveUrl: row.live_url ?? undefined,
    isFeatured: row.is_featured,
    tone: toneForSlug(row.slug),
    year: row.published_at ? row.published_at.slice(0, 4) : '',
  };
}

/** Static catalog first; DB projects with brand-new slugs appended. */
export function mergeProjects(base: Project[], extra: Project[]): Project[] {
  const seen = new Set(base.map((p) => p.slug));
  return [...base, ...extra.filter((p) => !seen.has(p.slug))];
}
