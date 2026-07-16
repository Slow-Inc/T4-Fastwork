import 'server-only';
import { publicDb } from '@/lib/public-db';
import { projects as staticProjects, type Project } from '@/content/catalog';
import { mapDbProject, mergeProjects, type DbProjectRow } from './project-map';
import { orderByRank } from './project-rank';

/**
 * Projects data access (Requirement §10 / §12). The rich curated catalog is the
 * base; projects created in the admin CMS (new slugs in the DB) are merged in so
 * they appear on the public site without a redeploy. Any DB/env failure falls
 * back to the static catalog, so the site never breaks.
 */

const SELECT =
  'slug,title,title_en,description,content,live_url,snapshot_image,is_featured,published_at,' +
  'ai_rank,' +
  'gh_owner,gh_repo,owner_type,owner_login,' +
  'category:categories(name),' +
  'project_technologies(technologies(name)),' +
  'project_tags(tags(name))';

/** slug → ai_rank for the published projects — drives the display order of the
 * (static-content) Featured / Selected-work / list without moving content to the DB (B5). */
function rankFromRows(rows: { slug: string; ai_rank: number | null }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) if (r.ai_rank != null) m.set(r.slug, r.ai_rank);
  return m;
}

export async function getProjectRankMap(): Promise<Map<string, number>> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('projects')
      .select('slug, ai_rank')
      // Public reads must be gated by BOTH the `status` publication flag and a
      // publish date — `published_at` alone let a draft/hidden row (e.g. a GitHub
      // auto-draft) leak once it had a date (#63).
      .eq('status', 'published')
      .not('published_at', 'is', null);
    if (error || !data) return new Map();
    return rankFromRows(data as { slug: string; ai_rank: number | null }[]);
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
    if (error || !data) return staticProjects;
    const rows = data as unknown as (DbProjectRow & { ai_rank: number | null })[];
    const dbProjects = rows.map(mapDbProject);
    // Content stays the static catalog (parity); the AI rank only reorders it (B5).
    return orderByRank(mergeProjects(staticProjects, dbProjects), rankFromRows(rows));
  } catch {
    return staticProjects;
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const fromStatic = staticProjects.find((p) => p.slug === slug);
  if (fromStatic) return fromStatic;
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
