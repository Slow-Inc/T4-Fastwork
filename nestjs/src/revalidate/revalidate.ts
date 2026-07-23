/**
 * Pure seam for #92 — after a direct-DB write (rank job / GitHub sync), tell the
 * Next.js frontend to bust its ISR cache for the public project pages. The
 * backend writes via the superuser pooler and never triggers the `revalidatePath`
 * propagation admin Server Actions use, so the live pages serve the pre-write
 * build until a redeploy. This POSTs the frontend's secret-guarded
 * `/api/revalidate` (no slug = bulk: `/projects` + every detail page).
 *
 * Fail-soft by design: a revalidation miss must never fail the write it follows —
 * with no secret it does nothing, and a fetch error is swallowed. The auth +
 * target logic lives on the frontend (`nextjs/lib/revalidate`); this is only the
 * trigger. Keep it framework-agnostic (Nest just wires `RevalidateService`).
 */
import { parseAllowedOrigins } from '../cors-origins';

export interface RevalidateDeps {
  fetchImpl: typeof fetch;
  /** Raw FRONTEND_ORIGIN (comma-separated allow-list); the first is the site. */
  frontendOrigin: string | undefined;
  /** Shared GITHUB_REFRESH_SECRET the frontend endpoint compares. */
  secret: string | undefined;
}

export type ContentRevalidationKind =
  'faq' | 'service' | 'certificate' | 'blog';

/** Fire a project revalidation at the frontend. With `slug`, targets that
 * detail page only (#143); without, bulk `/projects` + every detail. Returns
 * whether the POST was attempted+succeeded; never throws. */
export async function postProjectRevalidation(
  deps: RevalidateDeps,
  slug?: string | null,
): Promise<boolean> {
  const { fetchImpl, frontendOrigin, secret } = deps;
  if (!secret) return false;
  const origin = parseAllowedOrigins(frontendOrigin)[0];
  const qs = slug ? `?slug=${encodeURIComponent(slug)}` : '';
  try {
    await fetchImpl(`${origin}/api/revalidate${qs}`, {
      method: 'POST',
      headers: { 'x-refresh-secret': secret },
    });
    return true;
  } catch {
    return false;
  }
}

export async function postContentRevalidation(
  deps: RevalidateDeps,
  kind: ContentRevalidationKind,
): Promise<boolean> {
  const { fetchImpl, frontendOrigin, secret } = deps;
  if (!secret) return false;
  const origin = parseAllowedOrigins(frontendOrigin)[0];
  try {
    await fetchImpl(`${origin}/api/revalidate?kind=${kind}`, {
      method: 'POST',
      headers: { 'x-refresh-secret': secret },
    });
    return true;
  } catch {
    return false;
  }
}
