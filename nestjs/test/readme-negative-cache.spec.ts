/**
 * A 404 README must leave a durable marker (#177).
 *
 * `syncRepoDetail` swallowed the 404 and wrote nothing, while `refreshRepoDetail` still pushed
 * the readme key into `synced`. So the backfill's snapshot listing never saw the key, the same repo was
 * re-selected by the backfill forever, and taxonomy/case-study stayed blocked behind a candidate
 * that can never generate.
 */
import { describe, it, expect } from 'bun:test';
import {
  GithubDetailService,
  parseReadme,
} from '../src/github/github-detail.service';
import { GithubSnapshotService } from '../src/github/github.service';
import { snapshotKey } from '../src/github/github.config';

function notFound(): Error & { status: number } {
  const e = new Error('Not Found') as Error & { status: number };
  e.status = 404;
  return e;
}

/** In-memory snapshot store + a fetcher that 404s only the README. */
function harness(opts: { readme404: boolean }) {
  const rows = new Map<string, unknown>();
  const store = {
    read: async (key: string) =>
      rows.has(key) ? { data: rows.get(key), etag: null } : null,
    upsert: async (row: { key: string; data: unknown }) => {
      rows.set(row.key, row.data);
    },
  };
  const fetcher = {
    fetch: async (url: string) => {
      if (url.includes('/readme')) {
        if (opts.readme404) throw notFound();
        return {
          status: 200,
          data: {
            content: Buffer.from('# Real readme').toString('base64'),
            sha: 'sha-real',
          },
          etag: null,
        };
      }
      return { status: 200, data: [], etag: null };
    },
  };
  const snap = new GithubSnapshotService(fetcher as never, store);
  return { svc: new GithubDetailService(snap), rows };
}

const KEY = snapshotKey.repoReadme('Slow-Inc', 'narze');

describe('README negative cache (#177)', () => {
  it('a 404 README writes a durable marker under the readme key', async () => {
    const { svc, rows } = harness({ readme404: true });

    const res = await svc.syncRepoDetail('Slow-Inc', 'narze');

    expect(res.readmeSha).toBeNull();
    expect(res.readmeMissing).toBe(true);
    // The whole point: the key now exists, so the backfill queue can advance.
    expect(rows.has(KEY)).toBe(true);
  });

  it('the marker is never mistaken for a README, so generators skip instead of expanding it', async () => {
    const { svc, rows } = harness({ readme404: true });
    await svc.syncRepoDetail('Slow-Inc', 'narze');

    const marker = rows.get(KEY);

    // Both existing readers narrow on `markdown`/`sha`; the marker must carry neither, or a
    // generator would treat "no README" as "empty README" and burn an LLM call on nothing.
    expect(parseReadme(marker)).toBeNull();
    const o = marker as Record<string, unknown>;
    expect(o.markdown).toBeUndefined();
    expect(o.sha).toBeUndefined();
    expect(o.missing).toBe(true);
  });

  it('a real README is unaffected — still stored decoded with its sha', async () => {
    const { svc, rows } = harness({ readme404: false });

    const res = await svc.syncRepoDetail('Slow-Inc', 'narze');

    expect(res.readmeSha).toBe('sha-real');
    expect(res.readmeMissing).toBe(false);
    expect(rows.get(KEY)).toEqual({
      markdown: '# Real readme',
      sha: 'sha-real',
    });
  });
});
