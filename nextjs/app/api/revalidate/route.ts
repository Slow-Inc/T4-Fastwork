/**
 * Secret-guarded on-demand revalidation (#92). A CI/cron writer that mutates the
 * DB directly (the screenshot worker; later the rank job / GitHub sync) POSTs
 * here after a write so the ISR-cached public pages pick up the change on the
 * next visit — the same `revalidatePath` propagation admin Server Actions use,
 * which a non-admin writer otherwise never triggers.
 *
 * A project write also releases the cached project list by tag (#239) — a path
 * revalidation alone re-renders the route and reads the same cached data back.
 *
 * SECURITY BOUNDARY: fail-closed (no `GITHUB_REFRESH_SECRET` configured → 401),
 * constant-time secret compare, revalidates only public project paths, returns
 * no data. Auth + target logic live in the unit-tested `lib/revalidate` /
 * `lib/revalidate-project` seams; the allowlist covers project and content
 * public paths only, and the busted tag is a constant — never request input.
 */
import { revalidatePath } from 'next/cache';
import {
  authorizeRevalidate,
  contentRevalidationTargets,
  type ContentRevalidationKind,
} from '@/lib/revalidate';
import { revalidateProjectFromRouteHandler } from '@/lib/revalidate-project';

export async function POST(request: Request): Promise<Response> {
  const secret = request.headers.get('x-refresh-secret');
  if (!authorizeRevalidate(secret, process.env.GITHUB_REFRESH_SECRET)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const slug = params.get('slug');
  const kind = params.get('kind') as ContentRevalidationKind | null;
  if (kind && ['faq', 'service', 'certificate', 'blog'].includes(kind)) {
    // A content write (faq/service/certificate/blog) must NOT bust the projects tag — those
    // surfaces carry no cached project list.
    const targets = contentRevalidationTargets(kind);
    for (const t of targets) revalidatePath(t.path, t.type);
    return Response.json({ revalidated: targets.map((t) => t.path) });
  }
  // A project write: paths + the Data Cache tag, together (#239).
  const targets = revalidateProjectFromRouteHandler(slug);
  return Response.json({ revalidated: targets.map((t) => t.path) });
}
