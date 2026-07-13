/**
 * Refresh orchestration (ADR 0003, spec P2). Walks the team config and syncs
 * each repo-list resource (org first, then members) through an injected
 * `ResourceSyncer` (the ETag-aware `GithubSnapshotService`). Sequential by
 * design — one in-flight request keeps well under GitHub's secondary limit and
 * makes ordering deterministic; a per-resource failure is recorded and does not
 * abort the batch (serve-stale: the prior snapshot stays valid).
 *
 * v1 refreshes the repo *lists* (which already carry stars, description, primary
 * language, and pushed_at). The per-repo languages breakdown (WARM tier, gated
 * on a pushed_at delta) is a follow-up on #20.
 */
import {
  GITHUB_MEMBERS,
  GITHUB_ORG,
  githubUrl,
  snapshotKey,
} from './github.config';

export interface ResourceSyncer {
  syncResource(
    key: string,
    url: string,
  ): Promise<{ changed: boolean; data: unknown }>;
}

export interface RefreshSummary {
  synced: string[];
  changed: string[];
  failed: string[];
}

export class GithubRefreshService {
  constructor(
    private readonly syncer: ResourceSyncer,
    private readonly members: readonly string[] = GITHUB_MEMBERS,
    private readonly org: string = GITHUB_ORG,
  ) {}

  async refreshAll(): Promise<RefreshSummary> {
    const targets: { key: string; url: string }[] = [
      {
        key: snapshotKey.orgRepos(this.org),
        url: githubUrl.orgRepos(this.org),
      },
      ...this.members.map((login) => ({
        key: snapshotKey.memberRepos(login),
        url: githubUrl.userRepos(login),
      })),
    ];

    const summary: RefreshSummary = { synced: [], changed: [], failed: [] };
    for (const t of targets) {
      try {
        const r = await this.syncer.syncResource(t.key, t.url);
        summary.synced.push(t.key);
        if (r.changed) summary.changed.push(t.key);
      } catch {
        // Serve-stale: a failed resource keeps its prior snapshot. Record and
        // continue so one bad member never blocks the whole refresh.
        summary.failed.push(t.key);
      }
    }
    return summary;
  }
}
