import { describe, it, expect } from 'bun:test';
import {
  repoToMemberProjectRow,
  reconcileMemberProjects,
  type MemberWithLogin,
  type MemberProjectRow,
  type MemberProjectStore,
} from '../src/github/github-member-sync';
import type { SnapshotReadPort } from '../src/github/github-curate-run';

const rawRepo = (over: Record<string, unknown> = {}) => ({
  name: 'portfolio',
  html_url: 'https://github.com/xenodeve/portfolio',
  description: 'my site',
  language: 'TypeScript',
  pushed_at: '2025-06-01T00:00:00Z',
  fork: false,
  archived: false,
  ...over,
});

describe('repoToMemberProjectRow', () => {
  it('maps a raw repo to a member_projects row (no eligibility filter)', () => {
    const r = repoToMemberProjectRow(rawRepo(), 7);
    expect(r).toEqual({
      memberId: 7,
      name: 'portfolio',
      description: 'my site',
      url: 'https://github.com/xenodeve/portfolio',
      tech: ['TypeScript'],
      year: 2025,
    });
  });

  it('includes forks and archived repos (all public — admin curates)', () => {
    expect(repoToMemberProjectRow(rawRepo({ fork: true }), 1)).not.toBeNull();
    expect(
      repoToMemberProjectRow(rawRepo({ archived: true }), 1),
    ).not.toBeNull();
  });

  it('tolerates missing description / language / bad pushed_at', () => {
    const r = repoToMemberProjectRow(
      rawRepo({ description: null, language: null, pushed_at: 'x' }),
      1,
    );
    expect(r?.description).toBe('');
    expect(r?.tech).toEqual([]);
    expect(r?.year).toBe(0);
  });

  it('returns null for a malformed repo (no name/url)', () => {
    expect(repoToMemberProjectRow({ name: 'x' }, 1)).toBeNull();
    expect(repoToMemberProjectRow({}, 1)).toBeNull();
    expect(repoToMemberProjectRow(null, 1)).toBeNull();
  });
});

describe('reconcileMemberProjects', () => {
  function fakes(snapshots: Record<string, unknown>) {
    const upserted: MemberProjectRow[] = [];
    const reader: SnapshotReadPort = {
      read: async (key) => (key in snapshots ? { data: snapshots[key] } : null),
    };
    const store: MemberProjectStore = {
      getMembersWithLogin: async () => [],
      upsertMemberProjects: async (rows) => {
        upserted.push(...rows);
      },
    };
    return { reader, store, upserted };
  }

  const members: MemberWithLogin[] = [
    { id: 7, login: 'xenodeve' },
    { id: 9, login: 'ghost' }, // no snapshot → 0 repos
  ];

  it('collects every member public repo and upserts when apply=true', async () => {
    const { reader, store, upserted } = fakes({
      'repos:xenodeve': [
        rawRepo(),
        rawRepo({ name: 'app', html_url: 'https://github.com/xenodeve/app' }),
      ],
    });
    const res = await reconcileMemberProjects(members, reader, store, true);
    expect(res.total).toBe(2);
    expect(res.perMember).toEqual([
      { login: 'xenodeve', repos: 2 },
      { login: 'ghost', repos: 0 },
    ]);
    expect(upserted.map((r) => r.name).sort()).toEqual(['app', 'portfolio']);
    expect(upserted.every((r) => r.memberId === 7)).toBe(true);
  });

  it('dry-run (apply=false) computes counts WITHOUT upserting', async () => {
    const { reader, store, upserted } = fakes({
      'repos:xenodeve': [rawRepo()],
    });
    const res = await reconcileMemberProjects(members, reader, store, false);
    expect(res.total).toBe(1);
    expect(upserted).toEqual([]); // nothing written
  });
});
