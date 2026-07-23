import 'server-only';
import { publicDb } from '@/lib/public-db';
import { type Project } from '@/content/catalog';
import { mapDbProject, type DbProjectRow } from './project-map';
import {
  isMissingOverviewColumnError,
  SELECT_CORE,
  SELECT_WITH_OVERVIEW,
} from './projects-select';

/**
 * Projects data access (Requirement §10 / §12) — DB-ONLY.
 *
 * Both the list (`getAllProjects`) and the detail (`getProjectBySlug`) read the
 * published projects managed in the admin CMS / GitHub ingestion, with NO static
 * catalog: the public showcase mirrors the DB — and therefore the admin dashboard —
 * exactly, so everything is editable from admin (dev decision 2026-07-23). A DB/env
 * failure yields an empty result rather than falling back to hardcoded content.
 *
 * Public reads are gated by BOTH the `status` publication flag and a `published_at`
 * date — `published_at` alone let a draft/hidden row (e.g. a GitHub auto-draft) leak
 * once it had a date (#63). The DB `.order('ai_rank')` applies the AI display order.
 *
 * D3 overview columns (#130) are selected when present; if migration 0029 is not yet
 * applied, PostgREST returns PGRST204 and we retry without those columns so the
 * public site keeps working until prod apply is explicitly authorized.
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

  const withOv = await run(SELECT_WITH_OVERVIEW);
  if (!withOv.error) {
    if (!withOv.data) return slug ? null : [];
    return (
      Array.isArray(withOv.data) ? withOv.data : [withOv.data]
    ) as unknown as DbProjectRow[];
  }
  if (!isMissingOverviewColumnError(withOv.error)) return null;

  const core = await run(SELECT_CORE);
  if (core.error || !core.data) return slug ? null : [];
  return (
    Array.isArray(core.data) ? core.data : [core.data]
  ) as unknown as DbProjectRow[];
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
