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
