/**
 * Capped backfill of missing `repo:owner/repo:readme` snapshots (#158).
 * Pure selection — the controller calls existing `refreshRepoDetail` for each.
 */
import { snapshotKey } from './github.config';

export interface ReadmeBackfillCandidate {
  owner: string;
  repo: string;
  slug: string;
}

export function readmeSnapshotKey(owner: string, repo: string): string {
  return snapshotKey.repoReadme(owner, repo);
}

/** One stored `repo:owner/repo:readme` snapshot, as the backfill needs to judge it (#215). */
export interface ReadmeSnapshotState {
  key: string;
  /** True when the row is a #177 `{missing: true}` marker rather than a real README. */
  missing: boolean;
  /** The marker's `checkedAt`; null when absent or unparseable. */
  checkedAt: Date | null;
}

/**
 * How long a "this repo has no README" marker is trusted before it is re-checked.
 *
 * Six hours: a re-check costs one GitHub API call and no LLM call, so it is cheap, while still
 * leaving the hourly backfill's single slot free most of the time for repos that have never been
 * checked at all. Longer would leave a repo that gains a README waiting on the broad refresh's
 * rotating 8-repo budget — the delay #215 was filed for.
 */
export const README_MARKER_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * The keys that still answer "this repo has been checked", so the backfill may skip it.
 *
 * A real README always answers it. A #177 missing-marker answers it only until it expires: it
 * exists to advance the queue past a repo with no README, not to exclude that repo permanently —
 * a repo that later gains one has to be able to re-enter the queue. A marker with no readable
 * timestamp is treated as expired, because trusting it is the permanent exclusion this exists to
 * remove and the cost of being wrong is one API call.
 */
export function authoritativeReadmeKeys(
  states: readonly ReadmeSnapshotState[],
  now: Date = new Date(),
): Set<string> {
  const keys = new Set<string>();
  for (const s of states) {
    if (!s.missing) {
      keys.add(s.key);
      continue;
    }
    if (!s.checkedAt) continue;
    if (now.getTime() - s.checkedAt.getTime() > README_MARKER_TTL_MS) continue;
    keys.add(s.key);
  }
  return keys;
}

function normalizeKey(key: string): string {
  return key.toLowerCase();
}

/**
 * Keep candidates whose README snapshot is not yet in the cache, up to
 * `maxPerRun`. Preserves input order (featured / published_at from the store).
 */
export function selectReposMissingReadme(
  candidates: readonly ReadmeBackfillCandidate[],
  existingReadmeKeys: ReadonlySet<string> | readonly string[],
  maxPerRun: number = Number.POSITIVE_INFINITY,
): ReadmeBackfillCandidate[] {
  const existing = new Set(
    [...existingReadmeKeys].map((k) => normalizeKey(k)),
  );
  const out: ReadmeBackfillCandidate[] = [];
  for (const c of candidates) {
    if (out.length >= maxPerRun) break;
    const key = normalizeKey(readmeSnapshotKey(c.owner, c.repo));
    if (existing.has(key)) continue;
    out.push(c);
  }
  return out;
}
