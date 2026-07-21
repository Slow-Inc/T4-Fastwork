/**
 * The read side of curation: assemble the `CurateRepo[]` a curate run scores from
 * the durable snapshot cache (`github_snapshots`). Reads the org's repo list plus
 * every team member's repo list (the same keys `GithubRefreshService` populates),
 * flattens the raw GitHub arrays, and defensively projects each entry — a missing
 * or malformed snapshot is skipped, never fatal. Pure over an injected reader so
 * it is unit-tested without a DB; `CurateService` (github-curate.ts) then decides
 * eligibility and writes drafts.
 */
import { GITHUB_ORG, GITHUB_MEMBERS, snapshotKey } from './github.config';
import { toCurateRepo, type CurateRepo } from './github-curate';

/** Minimal read port satisfied by DrizzleSnapshotStore.read. */
export interface SnapshotReadPort {
  read(key: string): Promise<{ data: unknown } | null>;
}

export interface CollectOptions {
  org?: string;
  members?: readonly string[];
}

/** Org + every member's cached repo list → a flat, de-duped-by-nothing CurateRepo[]. */
export async function collectReposFromSnapshots(
  reader: SnapshotReadPort,
  opts: CollectOptions = {},
): Promise<CurateRepo[]> {
  const org = opts.org ?? GITHUB_ORG;
  const members = opts.members ?? GITHUB_MEMBERS;
  const keys = [
    snapshotKey.orgRepos(org),
    ...members.map((login) => snapshotKey.memberRepos(login)),
  ];
  const repos: CurateRepo[] = [];
  for (const key of keys) {
    const snap = await reader.read(key);
    if (!snap || !Array.isArray(snap.data)) continue;
    for (const raw of snap.data as unknown[]) {
      const repo = toCurateRepo(raw);
      if (repo) repos.push(repo);
    }
  }
  return repos;
}
