/**
 * Read side of the portfolio (ADR 0003, spec P4). Serves the durable snapshot —
 * never GitHub — so user traffic makes zero GitHub calls. Returns a `stale`
 * flag (snapshot older than the threshold) so the caller can implement
 * stale-while-heal: serve the stale data immediately AND kick off a background
 * refresh. A missing snapshot returns `null`, and the caller falls back to the
 * curated `site.ts` data.
 */
import { snapshotKey } from './github.config';

export interface SnapshotReader {
  read(key: string): Promise<{ data: unknown; updatedAt: Date } | null>;
}

export interface ReadResult {
  data: unknown;
  /** true when the snapshot is older than the staleness threshold. */
  stale: boolean;
}

export class GithubReadService {
  constructor(
    private readonly reader: SnapshotReader,
    private readonly staleMs: number = 5 * 60_000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async getResource(key: string): Promise<ReadResult | null> {
    const row = await this.reader.read(key);
    if (!row) return null;
    const stale = this.now() - row.updatedAt.getTime() > this.staleMs;
    return { data: row.data, stale };
  }

  getMemberRepos(login: string): Promise<ReadResult | null> {
    return this.getResource(snapshotKey.memberRepos(login));
  }

  getOrgRepos(org: string): Promise<ReadResult | null> {
    return this.getResource(snapshotKey.orgRepos(org));
  }

  // Showcase detail resources (spec 2026-07-14, P6/P7).
  getRepoContributors(owner: string, repo: string): Promise<ReadResult | null> {
    return this.getResource(snapshotKey.repoContributors(owner, repo));
  }

  getRepoPulls(owner: string, repo: string): Promise<ReadResult | null> {
    return this.getResource(snapshotKey.repoPulls(owner, repo));
  }

  getRepoReadme(owner: string, repo: string): Promise<ReadResult | null> {
    return this.getResource(snapshotKey.repoReadme(owner, repo));
  }

  /** The repo's language breakdown (`{ language: bytes }`) for the detail donut. */
  getRepoLanguages(owner: string, repo: string): Promise<ReadResult | null> {
    return this.getResource(snapshotKey.repoLanguages(owner, repo));
  }

  getUserProfile(login: string): Promise<ReadResult | null> {
    return this.getResource(snapshotKey.userProfile(login));
  }

  getUserReadme(login: string): Promise<ReadResult | null> {
    return this.getResource(snapshotKey.userReadme(login));
  }
}
