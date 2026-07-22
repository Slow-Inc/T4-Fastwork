import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Test } from '@nestjs/testing';
import { GithubMemberSyncController } from '../src/github/github-member-sync.controller';
import { GithubMemberSyncModule } from '../src/github/github-member-sync.module';
import { DRIZZLE } from '../src/database/database.module';
import type {
  MemberProjectStore,
  MemberProjectRow,
} from '../src/github/github-member-sync';
import type { SnapshotReadPort } from '../src/github/github-curate-run';

const SECRET = 'test-secret';

const rawRepo = (name: string) => ({
  name,
  html_url: `https://github.com/xenodeve/${name}`,
  description: 'x',
  language: 'TypeScript',
  pushed_at: '2025-06-01T00:00:00Z',
});

function make() {
  const upserted: MemberProjectRow[] = [];
  const store: MemberProjectStore = {
    getMembersWithLogin: async () => [{ id: 7, login: 'xenodeve' }],
    upsertMemberProjects: async (rows) => {
      upserted.push(...rows);
    },
  };
  const snapshots: SnapshotReadPort = {
    read: async (key) =>
      key === 'repos:xenodeve'
        ? { data: [rawRepo('portfolio'), rawRepo('app')] }
        : null,
  };
  return {
    ctrl: new GithubMemberSyncController(store, snapshots),
    upserted,
  };
}

describe('GithubMemberSyncController', () => {
  beforeEach(() => {
    process.env.GITHUB_REFRESH_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.GITHUB_REFRESH_SECRET;
  });

  it('rejects a missing/wrong secret (fail-closed)', async () => {
    const { ctrl } = make();
    await expect(ctrl.sync(undefined, {})).rejects.toThrow();
    await expect(ctrl.sync('wrong', {})).rejects.toThrow();
  });

  it('dry-run by default: reports per-member counts WITHOUT writing', async () => {
    const { ctrl, upserted } = make();
    const res = await ctrl.sync(SECRET, {});
    expect(res.applied).toBe(false);
    expect(res.total).toBe(2);
    expect(res.perMember).toEqual([{ login: 'xenodeve', repos: 2 }]);
    expect(upserted).toEqual([]);
  });

  it('apply:true upserts all public repos for the member', async () => {
    const { ctrl, upserted } = make();
    const res = await ctrl.sync(SECRET, { apply: true });
    expect(res.applied).toBe(true);
    expect(upserted.map((r) => r.name).sort()).toEqual(['app', 'portfolio']);
    expect(upserted.every((r) => r.memberId === 7)).toBe(true);
  });
});

describe('GithubMemberSyncModule', () => {
  it('compiles and provides the controller', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GithubMemberSyncModule],
    })
      .overrideProvider(DRIZZLE)
      .useValue({})
      .compile();
    expect(moduleRef.get(GithubMemberSyncController)).toBeInstanceOf(
      GithubMemberSyncController,
    );
  });
});
