import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { GithubCurateController } from '../src/github/github-curate.controller';
import type { ProjectDraftStore } from '../src/github/github-curate';
import type { SnapshotReadPort } from '../src/github/github-curate-run';

const SECRET = 'test-secret';

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

function make(existing: string[] = []) {
  const seen = new Set(existing);
  const insertedRows: string[] = [];
  const store: ProjectDraftStore = {
    existsBySlug: async (s) => seen.has(s),
    insertDraft: async (r) => {
      insertedRows.push(r.slug);
      seen.add(r.slug);
    },
  };
  const snapshots: SnapshotReadPort = {
    read: async (key) =>
      key === 'org:Slow-Inc'
        ? { data: [rawRepo('mangadock'), rawRepo('reactor')] }
        : null,
  };
  return { ctrl: new GithubCurateController(store, snapshots), insertedRows };
}

describe('GithubCurateController', () => {
  beforeEach(() => {
    process.env.GITHUB_REFRESH_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.GITHUB_REFRESH_SECRET;
  });

  it('rejects a missing or wrong secret (fail-closed)', async () => {
    const { ctrl } = make();
    await expect(ctrl.curate(undefined, {})).rejects.toThrow();
    await expect(ctrl.curate('wrong', {})).rejects.toThrow();
  });

  it('rejects when the secret env is unset even if a secret is sent', async () => {
    delete process.env.GITHUB_REFRESH_SECRET;
    const { ctrl } = make();
    await expect(ctrl.curate(SECRET, {})).rejects.toThrow();
  });

  it('dry-run by default: reports would-be drafts WITHOUT writing', async () => {
    const { ctrl, insertedRows } = make();
    const res = await ctrl.curate(SECRET, {});
    expect(res.applied).toBe(false);
    expect(res.candidates).toBe(2);
    expect(res.inserted.sort()).toEqual(['mangadock', 'reactor']);
    expect(insertedRows).toEqual([]); // nothing persisted
  });

  it('apply:true persists via the real store, skipping already-tracked', async () => {
    const { ctrl, insertedRows } = make(['mangadock']);
    const res = await ctrl.curate(SECRET, { apply: true });
    expect(res.applied).toBe(true);
    expect(res.inserted).toEqual(['reactor']);
    expect(insertedRows).toEqual(['reactor']);
  });
});
