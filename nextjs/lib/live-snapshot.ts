/**
 * Client-side Realtime subscription for the live-portfolio "double" (#25 R3).
 * A live surface (a team member page, a repo detail page) renders the durable
 * snapshot server-side (stale-OK), then mounts `<LiveSnapshot>` which subscribes
 * to Supabase Realtime on `github_snapshots` (enabled in R2). When the R4 heal
 * upserts a genuinely-new row, Postgres logical replication broadcasts it; this
 * subscriber sees the change for a watched key and triggers a re-read — the
 * viewer gets fresh data with no reload and no polling. On unmount (tab close)
 * the channel closes → quiet.
 *
 * This module is the pure, testable core (key derivation + client-side filter +
 * channel wiring). The React glue lives in `components/site/live-snapshot.tsx`.
 *
 * Keys are built with the same `healKey` builders the heal trigger uses, so the
 * watched keys always match what the backend upserts.
 */
import { healKey } from './heal';

/** The snapshot keys a member profile page depends on (repos + profile + readme). */
export function keysForMember(login: string): string[] {
  return [
    healKey.memberRepos(login),
    healKey.userProfile(login),
    healKey.userReadme(login),
  ];
}

/** The snapshot keys a repo detail page depends on (contributors + pulls + readme). */
export function keysForRepo(owner: string, repo: string): string[] {
  return [
    healKey.repoContributors(owner, repo),
    healKey.repoPulls(owner, repo),
    healKey.repoReadme(owner, repo),
  ];
}

/**
 * Map a snapshot key to the Next.js fetch cache tag that a Realtime hit must
 * bust so a re-read returns fresh data (`router.refresh()` alone re-renders but
 * does NOT invalidate the server-side fetch cache — see the Next 16 useRouter
 * docs). Mirrors the `tags` on the `lib/github.ts` reads: per-login `gh:<login>`
 * (repos/profile/readme) and per-repo `gh:<owner>/<repo>` (contributors/pulls/
 * readme). Returns null for keys with no live surface (e.g. `org:`, webhook
 * markers), so nothing unexpected is ever revalidated.
 */
export function tagForKey(key: string): string | null {
  const repo = key.match(
    /^repo:([A-Za-z0-9-]+\/[A-Za-z0-9._-]+):(?:contributors|pulls|readme)$/,
  );
  if (repo) return `gh:${repo[1]}`;
  const user = key.match(/^(?:user|repos):([A-Za-z0-9-]+)(?::readme)?$/);
  if (user) return `gh:${user[1]}`;
  return null;
}

/** True when a broadcast row's key is one this surface watches. */
export function matchesWatched(
  changedKey: string | undefined,
  watched: string[],
): boolean {
  return changedKey !== undefined && watched.includes(changedKey);
}

/** The minimal Realtime surface we use — kept narrow so tests can fake it. */
export interface RealtimeChannelLike {
  on(
    event: 'postgres_changes',
    filter: Record<string, unknown>,
    cb: (payload: { new?: { key?: string } }) => void,
  ): RealtimeChannelLike;
  subscribe(): RealtimeChannelLike;
}

export interface RealtimeClientLike {
  channel(name: string): RealtimeChannelLike;
  removeChannel(channel: RealtimeChannelLike): void;
}

/**
 * Subscribe to `github_snapshots` changes and call `onHit(key)` when a watched
 * key changes. Returns an unsubscribe function (call on unmount). Filtering is
 * client-side: the write volume is a handful of keys changing rarely, so one
 * table subscription + an in-memory key check is simpler and more robust than
 * per-key server filters over keys containing `/` and `:`.
 */
export function subscribeSnapshots(
  client: RealtimeClientLike,
  watched: string[],
  onHit: (key: string) => void,
): () => void {
  const channel = client
    .channel(`github_snapshots:${watched.join(',')}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'github_snapshots' },
      (payload) => {
        const key = payload.new?.key;
        if (matchesWatched(key, watched)) onHit(key as string);
      },
    )
    .subscribe();

  return () => client.removeChannel(channel);
}

/**
 * The refresh sequence a Realtime hit triggers, extracted from `<LiveSnapshot>`
 * so it is unit-testable without rendering the hook component (hook-based client
 * components can't render under the monorepo's bun/happy-dom setup). Bust the
 * matching fetch cache tags, then re-render. The tag-bust is best-effort — a
 * failure must NOT skip the refresh, which still re-renders from cache.
 */
export async function runLiveRefresh(
  watched: string[],
  deps: {
    refreshTags: (keys: string[]) => Promise<void>;
    refresh: () => void;
  },
): Promise<void> {
  try {
    await deps.refreshTags(watched);
  } catch {
    // best-effort; refresh() below still re-renders.
  }
  deps.refresh();
}
