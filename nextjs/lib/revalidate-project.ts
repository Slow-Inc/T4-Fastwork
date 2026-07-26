/**
 * The single way a project write is propagated (#239).
 *
 * #238 moved the unfiltered project list into the durable Data Cache under `PROJECTS_CACHE_TAG`.
 * `revalidatePath` does not reach that entry: the route re-renders, reads the same cached list
 * back, and the visitor sees pre-write content until the 600 s ceiling expires. Both propagations
 * therefore live in one call, so a writer cannot do the path half and miss the data half.
 *
 * Two entry points because Next 16 allows the two writer contexts different APIs:
 *
 * - a **Server Action** may call `updateTag`, which expires the entry immediately — the admin sees
 *   their own write (read-your-own-writes) instead of the list they just edited away from;
 * - a **Route Handler** may not (`updateTag` is Server-Action-only), so the cron / webhook / CI
 *   path uses `revalidateTag(tag, 'max')`. That is stale-while-revalidate: the first read after the
 *   write still serves the stale list while fetching fresh behind it. Well inside the ≤10 min
 *   freshness target (ADR 0004 / epic #185), but it means a freshness probe must read twice — see
 *   #240, which measures this rather than assuming it.
 */
import 'server-only';
import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import {
  PROJECTS_CACHE_TAG,
  revalidationTargets,
  type RevalidateTarget,
} from './revalidate';

/**
 * The paths an admin project write refreshes — exactly what each action revalidated before this
 * helper existed. Kept as-is deliberately: #239 adds the tag bust and changes nothing about which
 * routes are refreshed.
 */
export const ADMIN_PROJECT_PATHS: RevalidateTarget[] = [
  { path: '/admin/projects' },
  { path: '/projects' },
];

/** Propagate an admin CMS project write. `extraPaths` covers an action that also owns another
 * surface (the member-selection toggle refreshes `/admin/members`, #180). */
export function revalidateProjectFromAction(
  extraPaths: RevalidateTarget[] = [],
): void {
  for (const t of [...ADMIN_PROJECT_PATHS, ...extraPaths]) {
    revalidatePath(t.path, t.type);
  }
  updateTag(PROJECTS_CACHE_TAG);
}

/** Propagate a project write that arrived over HTTP (the secret-guarded `/api/revalidate`, reached
 * by the nestjs sync/generators/rank job and the screenshot CI). Returns the targets so the route
 * can report what it revalidated. */
export function revalidateProjectFromRouteHandler(
  slug?: string | null,
): RevalidateTarget[] {
  const targets = revalidationTargets(slug);
  for (const t of targets) revalidatePath(t.path, t.type);
  revalidateTag(PROJECTS_CACHE_TAG, 'max');
  return targets;
}
