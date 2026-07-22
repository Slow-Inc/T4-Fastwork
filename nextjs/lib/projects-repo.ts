import 'server-only';
import { publicDb } from '@/lib/public-db';
import { type Project } from '@/content/catalog';
import { mapDbProject, type DbProjectRow } from './project-map';

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
 */

const SELECT =
  'slug,title,title_en,description,content,live_url,snapshot_image,is_featured,published_at,' +
  'ai_rank,' +
  'gh_owner,gh_repo,owner_type,owner_login,' +
  'category:categories(name),' +
  'project_technologies(technologies(name)),' +
  'project_tags(tags(name))';

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

export async function getAllProjects(): Promise<Project[]> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('ai_rank', { ascending: true, nullsFirst: false });
    if (error || !data) return [];
    return (data as unknown as DbProjectRow[]).map(mapDbProject);
  } catch {
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT)
      .eq('slug', slug)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .maybeSingle();
    if (error || !data) return undefined;
    return mapDbProject(data as unknown as DbProjectRow);
  } catch {
    return undefined;
  }
}
