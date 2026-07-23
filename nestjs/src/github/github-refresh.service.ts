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
  GITHUB_SHOWCASE_REPOS,
  githubUrl,
  snapshotKey,
} from './github.config';

export interface ResourceSyncer {
  syncResource(
    key: string,
    url: string,
  ): Promise<{ changed: boolean; data: unknown }>;
}

/** The showcase detail layer (GithubDetailService) — optional in the refresh. */
export interface DetailSyncer {
  syncRepoDetail(
    owner: string,
    repo: string,
  ): Promise<{ readmeSha: string | null }>;
  syncUserProfile(login: string): Promise<void>;
}

/** Supplies the DB-derived set of published, github-backed repos to detail-sync
 *  (T2.4). Optional — when absent (or it throws) the refresh serves the static
 *  `showcaseRepos` constant, so the repo-list refresh and its tests are unchanged. */
export interface ShowcaseRepoProvider {
  listShowcaseRepos(): Promise<{ owner: string; repo: string }[]>;
}

/** Cap on repos whose detail is fetched per refresh (#135) — keeps the
 *  sequential GitHub calls under Vercel's ~60s window. Cron converges via
 *  hourly rotation across the full showcase set + ETag 304s. */
export const SHOWCASE_REPO_DETAIL_BUDGET = 8;

/**
 * Pick up to `budget` repos for this run, rotating the window hourly so every
 * published github project eventually gets detail sync (#135).
 */
export function selectReposForDetailSync(
  repos: readonly { owner: string; repo: string }[],
  budget: number = SHOWCASE_REPO_DETAIL_BUDGET,
  nowMs: number = Date.now(),
): { owner: string; repo: string }[] {
  if (repos.length <= budget) return [...repos];
  const offset = Math.floor(nowMs / 3_600_000) % repos.length;
  const rotated = [...repos.slice(offset), ...repos.slice(0, offset)];
  return rotated.slice(0, budget);
}

export interface RefreshSummary {
  synced: string[];
  changed: string[];
  failed: string[];
}

/** Outcome of a single-repo detail refresh (#143). */
export interface RepoDetailRefreshSummary extends RefreshSummary {
  readmeSha: string | null;
}

export class GithubRefreshService {
  constructor(
    private readonly syncer: ResourceSyncer,
    private readonly members: readonly string[] = GITHUB_MEMBERS,
    private readonly org: string = GITHUB_ORG,
    /** When provided, the refresh also populates showcase detail (spec P6/P7):
     *  each member's profile + profile README, and each showcase repo's
     *  contributors/pulls/README. Optional so the repo-list refresh (and its
     *  tests) work unchanged. */
    private readonly detail?: DetailSyncer,
    private readonly showcaseRepos: readonly {
      owner: string;
      repo: string;
    }[] = GITHUB_SHOWCASE_REPOS,
    /** T2.4 — DB source for the showcase repo set. When given, its published
     *  github-backed repos are unioned with `showcaseRepos` (the constant always
     *  included) so detail is fetched beyond the hardcoded MangaDock. */
    private readonly showcaseRepoProvider?: ShowcaseRepoProvider,
  ) {}

  /** The effective repos to detail-sync: the static constant unioned with the
   *  DB-derived set (deduped, constant first so MangaDock is always covered),
   *  then rotated+capped at SHOWCASE_REPO_DETAIL_BUDGET (#135). Falls back to
   *  the constant if the DB read fails — a provider outage never blocks the
   *  refresh (serve-stale). */
  private async resolveShowcaseRepos(
    nowMs: number = Date.now(),
  ): Promise<{ owner: string; repo: string }[]> {
    let candidates: { owner: string; repo: string }[] = [...this.showcaseRepos];
    if (this.showcaseRepoProvider) {
      try {
        candidates = [...candidates, ...(await this.showcaseRepoProvider.listShowcaseRepos())];
      } catch {
        // Serve-stale: a DB read failure falls back to the constant repos.
      }
    }
    const seen = new Set<string>();
    const deduped: { owner: string; repo: string }[] = [];
    for (const r of candidates) {
      const k = `${r.owner.toLowerCase()}/${r.repo.toLowerCase()}`;
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(r);
    }
    return selectReposForDetailSync(deduped, SHOWCASE_REPO_DETAIL_BUDGET, nowMs);
  }

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

    // Showcase detail (P6/P7): member profiles + tracked-repo detail. Each is
    // independent — a failure records the key and never aborts the batch.
    if (this.detail) {
      for (const login of this.members) {
        const key = snapshotKey.userProfile(login);
        try {
          await this.detail.syncUserProfile(login);
          summary.synced.push(key);
        } catch {
          summary.failed.push(key);
        }
      }
      const repos = await this.resolveShowcaseRepos();
      for (const { owner, repo } of repos) {
        const key = snapshotKey.repoContributors(owner, repo);
        try {
          await this.detail.syncRepoDetail(owner, repo);
          summary.synced.push(key);
        } catch {
          summary.failed.push(key);
        }
      }
    }
    return summary;
  }

  /**
   * Targeted detail sync for one owner/repo (#143). Does not refresh org/member
   * repo lists or member profiles — only contributors, pulls, languages, README.
   */
  async refreshRepoDetail(
    owner: string,
    repo: string,
  ): Promise<RepoDetailRefreshSummary> {
    const keys = [
      snapshotKey.repoContributors(owner, repo),
      snapshotKey.repoPulls(owner, repo),
      snapshotKey.repoLanguages(owner, repo),
      snapshotKey.repoReadme(owner, repo),
    ];
    const summary: RepoDetailRefreshSummary = {
      synced: [],
      changed: [],
      failed: [],
      readmeSha: null,
    };
    if (!this.detail) {
      summary.failed.push(keys[0]);
      return summary;
    }
    try {
      const r = await this.detail.syncRepoDetail(owner, repo);
      summary.synced.push(...keys);
      summary.readmeSha = r.readmeSha;
    } catch {
      summary.failed.push(keys[0]);
    }
    return summary;
  }
}

/** Refreshes exactly one owner's repo list — the webhook's targeted path. */
export class SnapshotOwnerRefresher {
  constructor(
    private readonly syncer: ResourceSyncer,
    private readonly org: string = GITHUB_ORG,
  ) {}

  async refreshOwner(owner: string): Promise<void> {
    const { key, url } =
      owner === this.org
        ? { key: snapshotKey.orgRepos(owner), url: githubUrl.orgRepos(owner) }
        : {
            key: snapshotKey.memberRepos(owner),
            url: githubUrl.userRepos(owner),
          };
    await this.syncer.syncResource(key, url);
  }
}
