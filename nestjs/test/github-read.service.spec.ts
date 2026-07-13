import { describe, it, expect } from 'bun:test';
import {
  GithubReadService,
  type SnapshotReader,
} from '../src/github/github-read.service';

function reader(
  rows: Record<string, { data: unknown; updatedAt: Date }> = {},
): SnapshotReader {
  return { read: async (key) => rows[key] ?? null };
}

const NOW = new Date('2026-07-13T12:00:00Z').getTime();
const clock = () => NOW;
const STALE_MS = 5 * 60_000; // 5 min

describe('GithubReadService.getResource', () => {
  it('returns null when there is no snapshot (caller falls back to site.ts)', async () => {
    const svc = new GithubReadService(reader(), STALE_MS, clock);
    expect(await svc.getResource('repos:nobody')).toBeNull();
  });

  it('returns data with stale:false when the snapshot is fresh', async () => {
    const svc = new GithubReadService(
      reader({
        'repos:foo': {
          data: [{ name: 'r' }],
          updatedAt: new Date(NOW - 60_000),
        },
      }),
      STALE_MS,
      clock,
    );
    const r = await svc.getResource('repos:foo');
    expect(r).toEqual({ data: [{ name: 'r' }], stale: false });
  });

  it('flags stale:true when the snapshot is older than the threshold', async () => {
    const svc = new GithubReadService(
      reader({
        'repos:foo': { data: { v: 1 }, updatedAt: new Date(NOW - 10 * 60_000) },
      }),
      STALE_MS,
      clock,
    );
    const r = await svc.getResource('repos:foo');
    expect(r?.stale).toBe(true);
    expect(r?.data).toEqual({ v: 1 });
  });

  it('maps member/org helpers to the right snapshot keys', async () => {
    const seen: string[] = [];
    const svc = new GithubReadService(
      { read: async (k) => (seen.push(k), null) },
      STALE_MS,
      clock,
    );
    await svc.getMemberRepos('xenodeve');
    await svc.getOrgRepos('Slow-Inc');
    expect(seen).toEqual(['repos:xenodeve', 'org:Slow-Inc']);
  });

  it('maps the showcase detail helpers to the right snapshot keys', async () => {
    const seen: string[] = [];
    const svc = new GithubReadService(
      { read: async (k) => (seen.push(k), null) },
      STALE_MS,
      clock,
    );
    await svc.getRepoContributors('Slow-Inc', 'MangaDock');
    await svc.getRepoPulls('Slow-Inc', 'MangaDock');
    await svc.getRepoReadme('Slow-Inc', 'MangaDock');
    await svc.getUserProfile('xenodeve');
    await svc.getUserReadme('xenodeve');
    expect(seen).toEqual([
      'repo:Slow-Inc/MangaDock:contributors',
      'repo:Slow-Inc/MangaDock:pulls',
      'repo:Slow-Inc/MangaDock:readme',
      'user:xenodeve',
      'user:xenodeve:readme',
    ]);
  });
});
