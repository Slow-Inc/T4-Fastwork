import 'server-only';
import { publicDb } from '@/lib/public-db';
import { type Project } from '@/content/catalog';
import { mapDbProject, type DbProjectRow } from './project-map';
import {
  isMissingProjectColumnError,
  PROJECT_SELECT_ATTEMPTS,
} from './projects-select';

/**
 * Projects data access (Requirement §10 / §12) — DB-ONLY.
 *
 * D3/D4 columns are selected when present; if migrations are not yet applied,
 * PostgREST returns PGRST204 and we retry a poorer SELECT so the public site
 * keeps working until prod apply is explicitly authorized.
 */

/** slug → ai_rank for the published projects — drives the AI display order of the
 * home "Selected work" editorial mosaic (a separate positional design element in
 * `content/projects.ts`) without moving that mosaic's content into the DB (B5). */
export async function getProjectRankMap(): Promise<Map<string, number>> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('projects')
      .select('slug, ai_rank')
      .eq('status', 'published')
      .not('published_at', 'is', null);
    if (error || !data) return new Map();
    const m = new Map<string, number>();
    for (const r of data as { slug: string; ai_rank: number | null }[]) {
      if (r.ai_rank != null) m.set(r.slug, r.ai_rank);
    }
    return m;
  } catch {
    return new Map();
  }
}

async function selectPublished(
  slug?: string,
): Promise<DbProjectRow[] | null> {
  const supabase = publicDb();
  const run = async (select: string) => {
    let q = supabase
      .from('projects')
      .select(select)
      .eq('status', 'published')
      .not('published_at', 'is', null);
    if (slug) {
      return q.eq('slug', slug).maybeSingle();
    }
    return q.order('ai_rank', { ascending: true, nullsFirst: false });
  };

  for (const select of PROJECT_SELECT_ATTEMPTS) {
    const res = await run(select);
    if (!res.error) {
      if (!res.data) return slug ? null : [];
      return (
        Array.isArray(res.data) ? res.data : [res.data]
      ) as unknown as DbProjectRow[];
    }
    if (!isMissingProjectColumnError(res.error)) return null;
  }
  return null;
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const rows = await selectPublished();
    if (!rows) return [];
    return rows.map(mapDbProject);
  } catch {
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  try {
    const rows = await selectPublished(slug);
    if (!rows || rows.length === 0) return undefined;
    return mapDbProject(rows[0]);
  } catch {
    return undefined;
  }
}
