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
  snapshot_image?: string | null;
  is_featured: boolean;
  published_at: string | null;
  gh_owner?: string | null;
  gh_repo?: string | null;
  owner_type?: string | null;
  owner_login?: string | null;
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
    snapshotImage: row.snapshot_image ?? undefined,
    isFeatured: row.is_featured,
    tone: toneForSlug(row.slug),
    year: row.published_at ? row.published_at.slice(0, 4) : '',
    ...(row.gh_owner && row.gh_repo
      ? { github: { owner: row.gh_owner, repo: row.gh_repo } }
      : {}),
    ...(row.owner_type === 'team' || row.owner_type === 'personal'
      ? { ownerType: row.owner_type }
      : {}),
    ...(row.owner_login ? { ownerLabel: row.owner_login } : {}),
  };
}

/**
 * Overlay a DB row's LIVE fields onto the curated static entry (ADR 0003 — live/
 * generated fields come from the DB, the static file stays the curated identity);
 * today that is the screenshot `snapshotImage` written by the screenshot worker,
 * which the static catalog can't carry. `liveUrl` is intentionally NOT overlaid:
 * the seeded DB rows hold the GitHub repo URL, which is worse than the curated one.
 * A missing/undefined DB row or a null `snapshotImage` leaves the static entry as-is.
 */
export function overlayLiveFields(base: Project, db: Project | undefined): Project {
  return db?.snapshotImage ? { ...base, snapshotImage: db.snapshotImage } : base;
}

/**
 * Static catalog is the curated base; for a slug present in both, the DB's live
 * fields are overlaid ([[overlayLiveFields]]). DB rows with brand-new slugs are
 * appended so CMS-created projects still appear.
 */
export function mergeProjects(base: Project[], extra: Project[]): Project[] {
  const dbBySlug = new Map(extra.map((p) => [p.slug, p]));
  const overlaid = base.map((p) => overlayLiveFields(p, dbBySlug.get(p.slug)));
  const baseSlugs = new Set(base.map((p) => p.slug));
  return [...overlaid, ...extra.filter((p) => !baseSlugs.has(p.slug))];
}
