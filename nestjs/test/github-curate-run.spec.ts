import { describe, it, expect } from 'bun:test';
import { collectReposFromSnapshots } from '../src/github/github-curate-run';
import type { SnapshotReadPort } from '../src/github/github-curate-run';

function reader(map: Record<string, unknown>): SnapshotReadPort {
  return {
    read: async (key) => (key in map ? { data: map[key] } : null),
  };
}

const rawRepo = (name: string, over: Record<string, unknown> = {}) => ({
  name,
  owner: { login: 'Slow-Inc' },
  html_url: `https://github.com/Slow-Inc/${name}`,
  description: 'x',
  fork: false,
  archived: false,
  private: false,
  stargazers_count: 1,
  pushed_at: '2026-06-01T00:00:00Z',
  ...over,
});

describe('collectReposFromSnapshots', () => {
  it('flattens org + member repo snapshots into CurateRepo[]', async () => {
    const r = reader({
      'org:Slow-Inc': [rawRepo('mangadock'), rawRepo('reactor')],
      'repos:xenodeve': [
        rawRepo('portfolio', { owner: { login: 'xenodeve' } }),
      ],
    });
    const repos = await collectReposFromSnapshots(r, {
      org: 'Slow-Inc',
      members: ['xenodeve'],
    });
    expect(repos.map((x) => x.name).sort()).toEqual([
      'mangadock',
      'portfolio',
      'reactor',
    ]);
  });

  it('skips a missing or non-array snapshot and drops malformed entries', async () => {
    const r = reader({
      'org:Slow-Inc': [rawRepo('good'), { name: 'bad' } /* no owner/url */, 7],
      // 'repos:ghost' absent → read() returns null
      'repos:weird': { not: 'an array' },
    });
    const repos = await collectReposFromSnapshots(r, {
      org: 'Slow-Inc',
      members: ['ghost', 'weird'],
    });
    expect(repos.map((x) => x.name)).toEqual(['good']);
  });
});
