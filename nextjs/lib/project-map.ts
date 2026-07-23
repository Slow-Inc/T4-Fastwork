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
  overview_summary?: string | null;
  overview_highlights?: string | null;
  overview_good_for?: string | null;
  overview_summary_en?: string | null;
  overview_highlights_en?: string | null;
  overview_good_for_en?: string | null;
  category: { name: string } | null;
  project_technologies: {
    technologies: {
      name: string;
      used_for?: string | null;
      used_for_en?: string | null;
    } | null;
  }[];
  project_tags: { tags: { name: string } | null }[];
}

export function mapDbProject(row: DbProjectRow): Project {
  const techRows = (row.project_technologies ?? [])
    .map((t) => t.technologies)
    .filter((t): t is NonNullable<typeof t> => Boolean(t?.name));
  const technologyDetails = techRows.map((t) => ({
    name: t.name,
    ...(t.used_for ? { usedFor: t.used_for } : {}),
    ...(t.used_for_en ? { usedForEn: t.used_for_en } : {}),
  }));
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
    technologies: techRows.map((t) => t.name),
    ...(technologyDetails.some((t) => t.usedFor)
      ? { technologyDetails }
      : {}),
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
    ...(row.overview_summary &&
    row.overview_highlights &&
    row.overview_good_for
      ? {
          overview: {
            summary: row.overview_summary,
            highlights: row.overview_highlights,
            goodFor: row.overview_good_for,
            summaryEn: row.overview_summary_en ?? undefined,
            highlightsEn: row.overview_highlights_en ?? undefined,
            goodForEn: row.overview_good_for_en ?? undefined,
          },
        }
      : {}),
  };
}
