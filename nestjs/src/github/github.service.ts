/**
 * GitHub fetch + snapshot layer (ADR 0003, spec P1). Ported from the
 * `resume_web` reference, made testable via constructor injection:
 *   - `GithubFetcher` does one authenticated, conditional GitHub REST call.
 *   - `GithubSnapshotService` ties the fetcher to a durable `SnapshotStore`,
 *     honoring ETag/304 so unchanged resources cost nothing (no rate limit)
 *     and are never overwritten with an empty 304 body.
 *
 * The token stays server-side (`GITHUB_TOKEN`); nothing here reaches the client.
 */

/** Minimal subset of the WHATWG `fetch` response this layer needs. */
export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}>;

/** Durable key→snapshot store (Supabase-backed in prod, faked in tests). */
export interface SnapshotStore {
  read(key: string): Promise<{ data: unknown; etag: string | null } | null>;
  upsert(row: {
    key: string;
    data: unknown;
    etag: string | null;
    pushedAt?: Date | null;
  }): Promise<void>;
}

export interface GithubFetchResult {
  status: number;
  /** `null` on a 304 (unchanged) — the caller keeps the prior snapshot. */
  data: unknown;
  etag: string | null;
}

export class GithubFetcher {
  constructor(
    private readonly fetchFn: FetchLike,
    private readonly token: string | undefined = process.env.GITHUB_TOKEN,
  ) {}

  /**
   * One conditional GitHub call. Pass the last-seen `etag` to send
   * `If-None-Match`; a `304` returns `data:null` (free of the primary rate
   * limit). A non-ok status throws an error carrying `.status` so callers can
   * back off on 403/429.
   */
  async fetch(url: string, etag?: string | null): Promise<GithubFetchResult> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 't4-fastwork-portfolio',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (etag) headers['If-None-Match'] = etag;

    const res = await this.fetchFn(url, { headers });

    if (res.status === 304)
      return { status: 304, data: null, etag: etag ?? null };
    if (!res.ok) {
      const err = new Error(`GitHub API ${res.status}`) as Error & {
        status?: number;
      };
      err.status = res.status;
      throw err;
    }
    return {
      status: res.status,
      data: await res.json(),
      etag: res.headers.get('etag'),
    };
  }
}

export class GithubSnapshotService {
  constructor(
    private readonly fetcher: GithubFetcher,
    private readonly store: SnapshotStore,
  ) {}

  /**
   * Conditionally refresh one resource into the store. Reads the prior etag,
   * fetches with `If-None-Match`, and on `304` keeps the prior snapshot
   * untouched; otherwise upserts the new payload.
   */
  async syncResource(
    key: string,
    url: string,
  ): Promise<{ changed: boolean; data: unknown }> {
    const prior = await this.store.read(key);
    const res = await this.fetcher.fetch(url, prior?.etag ?? null);

    if (res.status === 304 && prior) {
      return { changed: false, data: prior.data };
    }

    await this.store.upsert({ key, data: res.data, etag: res.etag });
    return { changed: true, data: res.data };
  }
}
