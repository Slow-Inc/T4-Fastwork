/**
 * Stale-while-heal trigger (ADR 0004, #25 R4). The live-surface read functions
 * in `lib/github.ts` serve the durable snapshot instantly; when the read-API
 * reports a snapshot as `stale`, this schedules a background heal via Next's
 * `after()` — a POST to the secret-guarded `/github/heal?key=` endpoint that
 * fetches GitHub (ETag-aware, single-flight) and upserts if genuinely new.
 *
 * The heal runs AFTER the response is sent, so it never adds latency to the
 * page. It is best-effort: any failure (backend down, no secret) is swallowed —
 * the page already served the stale data. The *current* viewer sees the fresh
 * data on their next revalidated read (and, once #25 R3 lands, live via the
 * Realtime "double" push without a reload).
 *
 * The heal keys here MUST match the backend `resolveHealTarget` regex
 * (`nestjs/src/github/github.config.ts`); a drift makes the heal a silent no-op.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100';

/** Snapshot-key builders — mirror `snapshotKey` / `resolveHealTarget` (backend). */
export const healKey = {
  memberRepos: (login: string) => `repos:${login}`,
  userProfile: (login: string) => `user:${login}`,
  userReadme: (login: string) => `user:${login}:readme`,
  repoContributors: (owner: string, repo: string) =>
    `repo:${owner}/${repo}:contributors`,
  repoPulls: (owner: string, repo: string) => `repo:${owner}/${repo}:pulls`,
  repoReadme: (owner: string, repo: string) => `repo:${owner}/${repo}:readme`,
};

/** True when a `{ data, stale }` ReadResult-shaped value is present and stale. */
function isStale(rr: unknown): boolean {
  return Boolean((rr as { stale?: boolean } | null)?.stale);
}

/** Keys to heal for a `/github/repos/:login` read (whole payload is one ReadResult). */
export function staleReposKeys(login: string, body: unknown): string[] {
  return isStale(body) ? [healKey.memberRepos(login)] : [];
}

/** Keys to heal for a `/github/users/:login` read (profile + readme, each own stale). */
export function staleUserKeys(login: string, body: unknown): string[] {
  const b = body as { profile?: unknown; readme?: unknown } | null;
  const keys: string[] = [];
  if (isStale(b?.profile)) keys.push(healKey.userProfile(login));
  if (isStale(b?.readme)) keys.push(healKey.userReadme(login));
  return keys;
}

/** Keys to heal for a repo-detail read (contributors + pulls + readme, each own stale). */
export function staleRepoDetailKeys(
  owner: string,
  repo: string,
  body: unknown,
): string[] {
  const b = body as
    | { contributors?: unknown; pulls?: unknown; readme?: unknown }
    | null;
  const keys: string[] = [];
  if (isStale(b?.contributors)) keys.push(healKey.repoContributors(owner, repo));
  if (isStale(b?.pulls)) keys.push(healKey.repoPulls(owner, repo));
  if (isStale(b?.readme)) keys.push(healKey.repoReadme(owner, repo));
  return keys;
}

export interface PostHealOpts {
  baseUrl?: string;
  secret?: string;
  fetchImpl?: typeof fetch;
}

/**
 * POST one heal to the backend. Secret-guarded (the caller is the Next server,
 * not the browser) and error-swallowing — a failed heal must never surface to
 * the user, who already got the stale data.
 */
export async function postHeal(
  key: string,
  opts: PostHealOpts = {},
): Promise<{ ok: boolean; skipped?: string }> {
  const {
    baseUrl = API_BASE,
    secret = process.env.GITHUB_REFRESH_SECRET,
    fetchImpl = fetch,
  } = opts;
  if (!secret) return { ok: false, skipped: 'no-secret' };
  try {
    const res = await fetchImpl(
      `${baseUrl}/github/heal?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'x-refresh-secret': secret },
        cache: 'no-store',
      },
    );
    return { ok: res.ok };
  } catch {
    return { ok: false, skipped: 'error' };
  }
}

export interface ScheduleHealOpts {
  /** Injected for tests; defaults to Next's `after` (lazy-imported at call time). */
  after?: (cb: () => unknown) => void;
  secret?: string;
  baseUrl?: string;
  /** Injected for tests; defaults to `postHeal`. */
  postImpl?: (key: string, opts: PostHealOpts) => Promise<unknown>;
}

/**
 * Register a post-response heal for every stale key. No-op when there are no
 * stale keys (the common case — idle = zero work). `after` is lazy-imported so
 * unit tests and non-Next callers don't transitively load `next/server`.
 */
export function scheduleHeal(keys: string[], opts: ScheduleHealOpts = {}): void {
  if (keys.length === 0) return;
  const { secret = process.env.GITHUB_REFRESH_SECRET, baseUrl = API_BASE } =
    opts;
  const post = opts.postImpl ?? postHeal;
  const run = () =>
    Promise.all(keys.map((key) => post(key, { baseUrl, secret })));

  if (opts.after) {
    opts.after(run);
    return;
  }
  // Lazy-load Next's `after` only in the real server path.
  void import('next/server').then(({ after }) => after(run));
}
