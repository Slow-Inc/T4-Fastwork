import { describe, it, expect } from 'bun:test';
import {
  GithubFetcher,
  GithubSnapshotService,
  type FetchLike,
  type SnapshotStore,
} from '../src/github/github.service';

// A fake GitHub HTTP response matching the FetchLike shape.
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

// Captures the last request so we can assert on headers sent.
function recordingFetch(res: ReturnType<typeof fakeRes>) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const fn: FetchLike = async (url, init) => {
    calls.push({ url, headers: init?.headers ?? {} });
    return res;
  };
  return { fn, calls };
}

// An in-memory SnapshotStore.
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

describe('GithubFetcher.fetch', () => {
  it('sends the token + Accept + If-None-Match, and returns data + etag on 200', async () => {
    const { fn, calls } = recordingFetch(
      fakeRes({ status: 200, body: [{ name: 'r' }], etag: 'W/"abc"' }),
    );
    const fetcher = new GithubFetcher(fn, 'ghp_token');

    const r = await fetcher.fetch('https://api.github.com/x', 'W/"old"');

    expect(calls[0].headers.Authorization).toBe('Bearer ghp_token');
    expect(calls[0].headers.Accept).toContain('github');
    expect(calls[0].headers['If-None-Match']).toBe('W/"old"');
    expect(r.status).toBe(200);
    expect(r.data).toEqual([{ name: 'r' }]);
    expect(r.etag).toBe('W/"abc"');
  });

  it('returns data:null on 304 (unchanged) and keeps the prior etag', async () => {
    const { fn } = recordingFetch(fakeRes({ status: 304 }));
    const fetcher = new GithubFetcher(fn, 'ghp_token');

    const r = await fetcher.fetch('https://api.github.com/x', 'W/"keep"');

    expect(r.status).toBe(304);
    expect(r.data).toBeNull();
    expect(r.etag).toBe('W/"keep"');
  });

  it('throws with .status on a non-ok response (e.g. 403 rate limit)', async () => {
    const { fn } = recordingFetch(fakeRes({ status: 403 }));
    const fetcher = new GithubFetcher(fn);

    let caught: (Error & { status?: number }) | null = null;
    try {
      await fetcher.fetch('https://api.github.com/x');
    } catch (e) {
      caught = e as Error & { status?: number };
    }
    expect(caught).not.toBeNull();
    expect(caught!.status).toBe(403);
  });

  it('omits Authorization when no token is configured', async () => {
    const { fn, calls } = recordingFetch(fakeRes({ status: 200, body: {} }));
    const fetcher = new GithubFetcher(fn);
    await fetcher.fetch('https://api.github.com/x');
    expect(calls[0].headers.Authorization).toBeUndefined();
  });
});

describe('GithubSnapshotService.syncResource', () => {
  it('fetches without If-None-Match and upserts when there is no prior snapshot', async () => {
    const { fn, calls } = recordingFetch(
      fakeRes({ status: 200, body: { v: 1 }, etag: 'W/"1"' }),
    );
    const store = memoryStore();
    const svc = new GithubSnapshotService(new GithubFetcher(fn), store);

    const r = await svc.syncResource('repos:foo', 'https://api.github.com/x');

    expect(calls[0].headers['If-None-Match']).toBeUndefined();
    expect(r.changed).toBe(true);
    expect(r.data).toEqual({ v: 1 });
    expect(store.rows['repos:foo']).toEqual({ data: { v: 1 }, etag: 'W/"1"' });
    expect(store.upserts).toBe(1);
  });

  it('keeps prior data and does NOT upsert when GitHub returns 304', async () => {
    const { fn, calls } = recordingFetch(fakeRes({ status: 304 }));
    const store = memoryStore({
      'repos:foo': { data: { v: 1 }, etag: 'W/"1"' },
    });
    const svc = new GithubSnapshotService(new GithubFetcher(fn), store);

    const r = await svc.syncResource('repos:foo', 'https://api.github.com/x');

    expect(calls[0].headers['If-None-Match']).toBe('W/"1"');
    expect(r.changed).toBe(false);
    expect(r.data).toEqual({ v: 1 });
    expect(store.upserts).toBe(0);
  });

  it('upserts the new payload when the resource changed (200 with new etag)', async () => {
    const { fn } = recordingFetch(
      fakeRes({ status: 200, body: { v: 2 }, etag: 'W/"2"' }),
    );
    const store = memoryStore({
      'repos:foo': { data: { v: 1 }, etag: 'W/"1"' },
    });
    const svc = new GithubSnapshotService(new GithubFetcher(fn), store);

    const r = await svc.syncResource('repos:foo', 'https://api.github.com/x');

    expect(r.changed).toBe(true);
    expect(store.rows['repos:foo']).toEqual({ data: { v: 2 }, etag: 'W/"2"' });
    expect(store.upserts).toBe(1);
  });
});
