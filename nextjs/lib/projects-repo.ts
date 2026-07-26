import 'server-only';
import { publicDb } from '@/lib/public-db';
import { type Project } from '@/content/catalog';
import { mapDbProject, type DbProjectRow } from './project-map';
import {
  isMissingProjectColumnError,
  PROJECT_SELECT_ATTEMPTS,
} from './projects-select';
import { createColumnLadder } from './column-ladder';
import { unstable_cache } from 'next/cache';

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

/**
 * Process-lifetime memo of the winning column set (#207). Module scope on purpose: a serverless
 * instance serves many requests, and paying the failing attempts once per instance instead of once
 * per request is the whole saving. The memo expires (`LADDER_MEMO_TTL_MS`) so a migration that lands
 * later is picked up without waiting for a cold start.
 */
const projectSelectLadder = createColumnLadder(PROJECT_SELECT_ATTEMPTS);

async function selectPublished(
  slug?: string,
): Promise<DbProjectRow[] | null> {
  const supabase = publicDb();
  const run = async (select: string) => {
    const q = supabase
      .from('projects')
      .select(select)
      .eq('status', 'published')
      .not('published_at', 'is', null);
    if (slug) {
      return q.eq('slug', slug).maybeSingle();
    }
    return q.order('ai_rank', { ascending: true, nullsFirst: false });
  };

  for (const select of projectSelectLadder.order()) {
    const res = await run(select);
    if (!res.error) {
      // Remember the set the database accepted so the next read in this process skips the attempts
      // that fail — measured at 3.2-3.7s per uncached read while 0032/0033 stay unapplied (#207).
      projectSelectLadder.remember(select);
      if (!res.data) return slug ? null : [];
      return (
        Array.isArray(res.data) ? res.data : [res.data]
      ) as unknown as DbProjectRow[];
    }
    if (!isMissingProjectColumnError(res.error)) return null;
  }
  return null;
}

/**
 * The cacheable read: mapped published projects, or a **thrown error** when the read failed (#234).
 *
 * Throwing is the point. `getAllProjects` has always swallowed failures into `[]`, which is right for
 * the page but makes "the pooler hiccuped" indistinguishable from "there are no published projects" —
 * and once that `[]` is stored in a durable cache, `/projects` stays blank for the whole TTL. Keeping
 * the swallow OUTSIDE this function is what lets the cache store successes only.
 *
 * A successful query returning zero rows is a real answer and IS cacheable.
 */
export async function fetchPublishedProjects(): Promise<Project[]> {
  const rows = await selectPublished();
  // `selectPublished` returns null only when the column-fallback ladder was exhausted on a real
  // error; an empty result set comes back as [].
  if (!rows) throw new Error('projects: select failed (ladder exhausted)');
  return rows.map(mapDbProject);
}

/** The tag every project write must bust. One name, so a writer cannot miss half of it. */
export const PROJECTS_CACHE_TAG = 'projects';

/**
 * Ceiling, not the mechanism. Invalidation is by tag on write (see `app/api/revalidate/route.ts` and
 * the admin Server Actions); this bound only limits how long a MISSED invalidation can serve stale
 * data — 10 minutes, matching the "visible ≤ 10 min" target in ADR 0004 / epic #185.
 */
export const PROJECTS_CACHE_TTL_SECONDS = 600;

/**
 * Durable, cross-invocation cache of the unfiltered list (#234).
 *
 * Why `unstable_cache` and not `'use cache'`: per the vendored Next 16 docs (`cacheHandlers.md:24,66`)
 * `'use cache'` **and `'use cache: remote'`** fall back to an in-memory LRU isolated to each process
 * when no `cacheHandlers` is configured — on Vercel serverless that is per-instance and mostly unused,
 * which is exactly the ceiling the module-scope memo in `column-ladder.ts` already hit (#207: 3.2-3.7s
 * → 1.4-1.6s, never sub-second). `unstable_cache` targets the Data Cache, documented to "persist the
 * result across requests and deployments". See ADR 0014 for the three cache layers.
 *
 * One entry for every visitor: the unfiltered list is cached and the query-string filter is applied
 * afterwards in memory, so a filter combination can never fragment the cache.
 */
const cachedPublishedProjects = unstable_cache(
  fetchPublishedProjects,
  ['projects:published:v1'],
  { tags: [PROJECTS_CACHE_TAG], revalidate: PROJECTS_CACHE_TTL_SECONDS },
);

/**
 * Page-facing read. Degrades to an empty list so a visitor gets a page instead of a crash — the
 * long-standing behaviour, deliberately kept OUTSIDE the cache boundary so a failure is never the
 * thing that gets stored (#234).
 */
export async function getAllProjects(): Promise<Project[]> {
  try {
    return await cachedPublishedProjects();
  } catch {
    // The CACHE layer failed (an outage, or no request scope). Fall back to a direct read: a broken
    // cache must make the page slower, never emptier. Swallowing this into `[]` would make a cache
    // outage indistinguishable from an empty database and blank a live page (#234).
    try {
      return await fetchPublishedProjects();
    } catch {
      return [];
    }
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
