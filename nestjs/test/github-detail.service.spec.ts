import { describe, it, expect } from 'bun:test';
import { snapshotKey, githubUrl } from '../src/github/github.config';
import {
  parseReadme,
  GithubDetailService,
} from '../src/github/github-detail.service';
import {
  GithubFetcher,
  GithubSnapshotService,
  type FetchLike,
  type SnapshotStore,
} from '../src/github/github.service';

// ---- shared fakes (mirror github.service.spec.ts) -------------------------

function fakeRes(opts: {
  status: number;
  body?: unknown;
  etag?: string | null;
}) {
  return {
    status: opts.status,
    ok: opts.status >= 200 && opts.status < 300,
    headers: {
      get: (n: string) =>
        n.toLowerCase() === 'etag' ? (opts.etag ?? null) : null,
    },
    json: async () => opts.body,
  };
}

/** A fetch that returns a per-URL response, recording every URL requested. */
function routedFetch(routes: Record<string, ReturnType<typeof fakeRes>>) {
  const urls: string[] = [];
  const fn: FetchLike = async (url) => {
    urls.push(url);
    const hit = Object.keys(routes).find((frag) => url.includes(frag));
    if (!hit) return fakeRes({ status: 404 });
    return routes[hit];
  };
  return { fn, urls };
}

function memoryStore(
  seed: Record<string, { data: unknown; etag: string | null }> = {},
): SnapshotStore & { rows: typeof seed; upserts: number } {
  const rows = { ...seed };
  let upserts = 0;
  return {
    rows,
    get upserts() {
      return upserts;
    },
    read: async (key) => rows[key] ?? null,
    upsert: async (row) => {
      upserts++;
      rows[row.key] = { data: row.data, etag: row.etag };
    },
  };
}

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

// ---- Slice 1: config builders --------------------------------------------

describe('snapshotKey / githubUrl — showcase detail resources', () => {
  it('builds stable snapshot keys for the five new resources', () => {
    expect(snapshotKey.repoContributors('Slow-Inc', 'MangaDock')).toBe(
      'repo:Slow-Inc/MangaDock:contributors',
    );
    expect(snapshotKey.repoPulls('Slow-Inc', 'MangaDock')).toBe(
      'repo:Slow-Inc/MangaDock:pulls',
    );
    expect(snapshotKey.repoReadme('Slow-Inc', 'MangaDock')).toBe(
      'repo:Slow-Inc/MangaDock:readme',
    );
    expect(snapshotKey.userProfile('xenodeve')).toBe('user:xenodeve');
    expect(snapshotKey.userReadme('xenodeve')).toBe('user:xenodeve:readme');
  });

  it('builds the matching GitHub REST URLs', () => {
    expect(githubUrl.repoContributors('a', 'b')).toBe(
      'https://api.github.com/repos/a/b/contributors?per_page=100',
    );
    expect(githubUrl.repoPulls('a', 'b')).toBe(
      'https://api.github.com/repos/a/b/pulls?state=open&per_page=100',
    );
    expect(githubUrl.repoReadme('a', 'b')).toBe(
      'https://api.github.com/repos/a/b/readme',
    );
    expect(githubUrl.userProfile('x')).toBe('https://api.github.com/users/x');
    // profile README lives in the special <login>/<login> repo
    expect(githubUrl.userReadme('x')).toBe(
      'https://api.github.com/repos/x/x/readme',
    );
  });
});

// ---- Slice 2: parseReadme -------------------------------------------------

describe('parseReadme', () => {
  it('decodes base64 content and keeps the blob sha', () => {
    const res = parseReadme({
      content: b64('# Hello\n\nworld'),
      encoding: 'base64',
      sha: 'abc123',
    });
    expect(res).toEqual({ markdown: '# Hello\n\nworld', sha: 'abc123' });
  });

  it('returns null for a missing/invalid payload', () => {
    expect(parseReadme(null)).toBeNull();
    expect(parseReadme({ encoding: 'base64' })).toBeNull();
    expect(parseReadme('nope')).toBeNull();
  });
});

// ---- Slice 3: syncRepoDetail ---------------------------------------------

describe('GithubDetailService.syncRepoDetail', () => {
  it('snapshots contributors, open pulls, and readme for one repo', async () => {
    const { fn } = routedFetch({
      '/contributors': fakeRes({
        status: 200,
        body: [{ login: 'xenodeve', contributions: 12 }],
        etag: 'W/"c"',
      }),
      '/pulls': fakeRes({
        status: 200,
        body: [{ user: { login: 'guest' } }],
        etag: 'W/"p"',
      }),
      '/readme': fakeRes({
        status: 200,
        body: { content: b64('# Doc'), encoding: 'base64', sha: 'sha1' },
        etag: 'W/"r"',
      }),
    });
    const store = memoryStore();
    const snap = new GithubSnapshotService(new GithubFetcher(fn), store);
    const svc = new GithubDetailService(snap);

    const r = await svc.syncRepoDetail('Slow-Inc', 'MangaDock');

    expect(store.rows['repo:Slow-Inc/MangaDock:contributors']?.data).toEqual([
      { login: 'xenodeve', contributions: 12 },
    ]);
    expect(store.rows['repo:Slow-Inc/MangaDock:pulls']?.data).toEqual([
      { user: { login: 'guest' } },
    ]);
    expect(store.rows['repo:Slow-Inc/MangaDock:readme']?.data).toEqual({
      markdown: '# Doc',
      sha: 'sha1',
    });
    expect(r.readmeSha).toBe('sha1');
    expect(store.upserts).toBe(3);
  });

  it('tolerates a missing readme (404) without failing the repo', async () => {
    const { fn } = routedFetch({
      '/contributors': fakeRes({ status: 200, body: [], etag: 'W/"c"' }),
      '/pulls': fakeRes({ status: 200, body: [], etag: 'W/"p"' }),
      // no /readme route → 404
    });
    const store = memoryStore();
    const snap = new GithubSnapshotService(new GithubFetcher(fn), store);
    const svc = new GithubDetailService(snap);

    const r = await svc.syncRepoDetail('a', 'b');

    expect(r.readmeSha).toBeNull();
    expect(store.rows['repo:a/b:contributors']).toBeDefined();
    expect(store.rows['repo:a/b:pulls']).toBeDefined();
    expect(store.rows['repo:a/b:readme']).toBeUndefined();
  });
});

// ---- Slice 4: syncUserProfile --------------------------------------------

describe('GithubDetailService.syncUserProfile', () => {
  it('snapshots the user profile and profile README', async () => {
    const { fn } = routedFetch({
      '/users/xenodeve': fakeRes({
        status: 200,
        body: { login: 'xenodeve', avatar_url: 'http://a/av.png' },
        etag: 'W/"u"',
      }),
      '/repos/xenodeve/xenodeve/readme': fakeRes({
        status: 200,
        body: { content: b64('hi'), encoding: 'base64', sha: 's' },
        etag: 'W/"pr"',
      }),
    });
    const store = memoryStore();
    const snap = new GithubSnapshotService(new GithubFetcher(fn), store);
    const svc = new GithubDetailService(snap);

    await svc.syncUserProfile('xenodeve');

    expect((store.rows['user:xenodeve']?.data as { login: string }).login).toBe(
      'xenodeve',
    );
    expect(store.rows['user:xenodeve:readme']?.data).toEqual({
      markdown: 'hi',
      sha: 's',
    });
  });

  it('tolerates a member with no profile README repo (404)', async () => {
    const { fn } = routedFetch({
      '/users/akkanop-x': fakeRes({
        status: 200,
        body: { login: 'akkanop-x' },
        etag: 'W/"u"',
      }),
      // no <login>/<login> readme → 404
    });
    const store = memoryStore();
    const snap = new GithubSnapshotService(new GithubFetcher(fn), store);
    const svc = new GithubDetailService(snap);

    await svc.syncUserProfile('akkanop-x');

    expect(store.rows['user:akkanop-x']).toBeDefined();
    expect(store.rows['user:akkanop-x:readme']).toBeUndefined();
  });
});
