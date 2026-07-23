/**
 * Fill null `projects.live_url` from GitHub Website (homepage) cached in
 * list snapshots (#157 / epic #156). Pure planning + thin store/controller.
 */
import { mapRepoMetadata } from './github-case-study';
import { toCurateRepo } from './github-curate';

export interface LiveUrlCandidate {
  id: number;
  slug: string;
  ghOwner: string;
  ghRepo: string;
  liveUrl: string | null;
}

export interface LiveUrlFill {
  id: number;
  slug: string;
  liveUrl: string;
}

export interface LiveUrlStore {
  listPublishedGithubNeedingLiveUrl(): Promise<LiveUrlCandidate[]>;
  applyLiveUrl(id: number, liveUrl: string): Promise<void>;
}

export interface LiveUrlSnapshotReader {
  /** Raw GitHub repo-list JSON arrays (org + member `repos:*` snapshots). */
  readRepoLists(): Promise<unknown[]>;
}

function identityKey(owner: string, repo: string): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

/**
 * Build owner/repo → raw homepage (or null) from one or more GitHub list arrays.
 */
export function buildHomepageIndex(
  repoListArrays: unknown[],
): Map<string, string | null> {
  const idx = new Map<string, string | null>();
  for (const list of repoListArrays) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      const repo = toCurateRepo(raw);
      if (!repo) continue;
      idx.set(
        identityKey(repo.owner.login, repo.name),
        repo.homepage ?? null,
      );
    }
  }
  return idx;
}

/**
 * Plan fills for published projects with null live_url when a homepage exists.
 * Does not overwrite an existing live_url. Caps at `maxPerRun` when set.
 */
export function planLiveUrlFills(
  candidates: LiveUrlCandidate[],
  homepageByIdentity: Map<string, string | null>,
  maxPerRun: number = Number.POSITIVE_INFINITY,
): LiveUrlFill[] {
  const out: LiveUrlFill[] = [];
  for (const c of candidates) {
    if (out.length >= maxPerRun) break;
    if (c.liveUrl) continue;
    const home = homepageByIdentity.get(identityKey(c.ghOwner, c.ghRepo));
    if (home == null) continue;
    const liveUrl = mapRepoMetadata({ homepageUrl: home }).liveUrl;
    if (!liveUrl) continue;
    out.push({ id: c.id, slug: c.slug, liveUrl });
  }
  return out;
}

export async function runLiveUrlFill(
  store: LiveUrlStore,
  snapshots: LiveUrlSnapshotReader,
  opts: { apply: boolean; maxPerRun: number },
): Promise<{
  candidates: number;
  filled: number;
  applied: boolean;
  capped: boolean;
  patches: LiveUrlFill[];
}> {
  const candidates = await store.listPublishedGithubNeedingLiveUrl();
  const lists = await snapshots.readRepoLists();
  const idx = buildHomepageIndex(lists);
  const patches = planLiveUrlFills(candidates, idx, opts.maxPerRun);
  if (opts.apply) {
    for (const p of patches) {
      await store.applyLiveUrl(p.id, p.liveUrl);
    }
  }
  return {
    candidates: candidates.length,
    filled: patches.length,
    applied: opts.apply,
    capped: patches.length >= opts.maxPerRun,
    patches,
  };
}
