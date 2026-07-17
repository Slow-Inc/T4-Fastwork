/**
 * Secret-guarded on-demand revalidation (#92). A CI/cron writer that mutates the
 * DB directly (the screenshot worker; later the rank job / GitHub sync) POSTs
 * here after a write so the ISR-cached public pages pick up the change on the
 * next visit — the same `revalidatePath` propagation admin Server Actions use,
 * which a non-admin writer otherwise never triggers.
 *
 * SECURITY BOUNDARY: fail-closed (no `GITHUB_REFRESH_SECRET` configured → 401),
 * constant-time secret compare, revalidates only public project paths, returns
 * no data. Auth + target logic live in the unit-tested `lib/revalidate` seam.
 */
import { revalidatePath } from 'next/cache';
import { authorizeRevalidate, revalidationTargets } from '@/lib/revalidate';

export async function POST(request: Request): Promise<Response> {
  const secret = request.headers.get('x-refresh-secret');
  if (!authorizeRevalidate(secret, process.env.GITHUB_REFRESH_SECRET)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const slug = new URL(request.url).searchParams.get('slug');
  const targets = revalidationTargets(slug);
  for (const t of targets) revalidatePath(t.path, t.type);
  return Response.json({ revalidated: targets.map((t) => t.path) });
}
