/**
 * Per-repo + per-user detail sync for the project showcase (spec 2026-07-14,
 * P1). Layers on the generic `GithubSnapshotService` (ETag/304-aware): it adds
 * the resources the showcase needs beyond the repo list —
 *   - repo: contributors, open pull requests, README (decoded markdown + sha)
 *   - user: profile (avatar/name/bio), profile README (the `<login>/<login>` repo)
 *
 * Optional resources (a repo with no README, a member with no profile-README
 * repo) return 404 from GitHub; those are tolerated so one missing file never
 * fails the whole repo/user. Required resources (contributors, pulls, profile)
 * propagate errors so a 403/429 rate-limit surfaces to the caller.
 */
import { snapshotKey, githubUrl } from './github.config';
import type { GithubSnapshotService } from './github.service';

export interface ReadmeSnapshot {
  markdown: string;
  sha: string;
}

/**
 * Decode a GitHub `GET /readme` payload (`{ content: <base64>, sha }`) into
 * `{ markdown, sha }`. Returns `null` for a missing/invalid payload. The `sha`
 * is the blob SHA the P3 delta gate compares against to skip unchanged READMEs.
 */
export function parseReadme(payload: unknown): ReadmeSnapshot | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as { content?: unknown; sha?: unknown };
  if (typeof p.content !== 'string' || typeof p.sha !== 'string') return null;
  // GitHub base64 is line-wrapped; Buffer ignores the newlines.
  const markdown = Buffer.from(p.content, 'base64').toString('utf8');
  return { markdown, sha: p.sha };
}

function isNotFound(err: unknown): boolean {
  return (err as { status?: number })?.status === 404;
}

export class GithubDetailService {
  constructor(private readonly snap: GithubSnapshotService) {}

  /**
   * Snapshot contributors, open pulls, and README for one repo. Returns the
   * README blob `sha` (or `null` if the repo has no README) so a caller can
   * gate content regeneration on README changes.
   */
  async syncRepoDetail(
    owner: string,
    repo: string,
  ): Promise<{ readmeSha: string | null }> {
    await this.snap.syncResource(
      snapshotKey.repoContributors(owner, repo),
      githubUrl.repoContributors(owner, repo),
    );
    await this.snap.syncResource(
      snapshotKey.repoPulls(owner, repo),
      githubUrl.repoPulls(owner, repo),
    );

    // Language breakdown (`{ language: bytes }`) for the detail donut. Tolerant —
    // a repo with no detectable language returns an empty object, never fails.
    try {
      await this.snap.syncResource(
        snapshotKey.repoLanguages(owner, repo),
        githubUrl.repoLanguages(owner, repo),
      );
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }

    let readmeSha: string | null = null;
    try {
      const r = await this.snap.syncResource(
        snapshotKey.repoReadme(owner, repo),
        githubUrl.repoReadme(owner, repo),
        { map: parseReadme },
      );
      readmeSha = (r.data as ReadmeSnapshot | null)?.sha ?? null;
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }
    return { readmeSha };
  }

  /** Snapshot a member's profile and their profile README (optional). */
  async syncUserProfile(login: string): Promise<void> {
    await this.snap.syncResource(
      snapshotKey.userProfile(login),
      githubUrl.userProfile(login),
    );
    try {
      await this.snap.syncResource(
        snapshotKey.userReadme(login),
        githubUrl.userReadme(login),
        { map: parseReadme },
      );
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }
  }
}
