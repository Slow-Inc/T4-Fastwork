/**
 * Pure seam for the secret-guarded revalidate endpoint (#92). A CI/cron writer
 * (the screenshot worker, and later the rank job / GitHub sync) writes the DB
 * directly and never busts the Next ISR cache, so the public pages serve the
 * pre-write build. This lets such a writer POST `/api/revalidate` to trigger the
 * same `revalidatePath` propagation admin Server Actions already use.
 *
 * The auth + target logic is here (pure, unit-tested); the route handler
 * (`app/api/revalidate/route.ts`) is a thin adapter over it.
 */
import { createHash, timingSafeEqual } from 'node:crypto';

/** Constant-time string compare. Hashes both sides so differing lengths compare
 * safely (timingSafeEqual throws on unequal-length buffers), and a blank/absent
 * value never matches. */
export function constantTimeEqual(
  a: string | undefined | null,
  b: string | undefined | null,
): boolean {
  if (!a || !b) return false;
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Authorize a revalidate request. Fails closed: no configured secret → reject
 * (an endpoint with no secret must never revalidate on demand). */
export function authorizeRevalidate(
  headerSecret: string | undefined | null,
  envSecret: string | undefined | null,
): boolean {
  if (!envSecret) return false;
  return constantTimeEqual(headerSecret, envSecret);
}

export interface RevalidateTarget {
  path: string;
  type?: 'page' | 'layout';
}

/** The paths to revalidate for a project write. With a slug, target that one
 * detail page; without, target every detail page via the dynamic template. The
 * list page is always included. */
export function revalidationTargets(
  slug?: string | null,
): RevalidateTarget[] {
  const targets: RevalidateTarget[] = [{ path: '/projects' }];
  if (slug) targets.push({ path: `/projects/${slug}` });
  else targets.push({ path: '/projects/[slug]', type: 'page' });
  return targets;
}
