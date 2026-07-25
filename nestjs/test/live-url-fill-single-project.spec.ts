/**
 * One push must fill one project's live_url — not sweep dozens of unrelated rows (#201).
 * The pipeline executor receives a single planned project, so the fill has to be scoped to it:
 * the bulk pass costs extra writes inside a 60s function budget and invalidates the state the
 * rest of the run is still reasoning about.
 */
import { describe, it, expect } from 'bun:test';
import {
  runLiveUrlFill,
  type LiveUrlCandidate,
  type LiveUrlStore,
  type LiveUrlSnapshotReader,
} from '../src/github/live-url-fill';

const CANDIDATES: LiveUrlCandidate[] = [
  { id: 1, slug: 'alpha', ghOwner: 'Slow-Inc', ghRepo: 'alpha', liveUrl: null },
  { id: 2, slug: 'beta', ghOwner: 'Slow-Inc', ghRepo: 'beta', liveUrl: null },
  { id: 3, slug: 'gamma', ghOwner: 'Slow-Inc', ghRepo: 'gamma', liveUrl: null },
];

function fakeStore(): { store: LiveUrlStore; applied: number[] } {
  const applied: number[] = [];
  return {
    applied,
    store: {
      listPublishedGithubNeedingLiveUrl: () => Promise.resolve(CANDIDATES),
      applyLiveUrl: (id) => {
        applied.push(id);
        return Promise.resolve();
      },
    },
  };
}

const snapshots: LiveUrlSnapshotReader = {
  readRepoLists: () =>
    Promise.resolve([
      CANDIDATES.map((c) => ({
        name: c.ghRepo,
        owner: { login: c.ghOwner },
        html_url: `https://github.com/${c.ghOwner}/${c.ghRepo}`,
        pushed_at: '2026-07-01T00:00:00Z',
        homepage: `https://${c.slug}.example`,
      })),
    ]),
};

describe('runLiveUrlFill scoped to one project (#201)', () => {
  it('applies only the requested project even though others also need a live_url', async () => {
    const { store, applied } = fakeStore();

    const res = await runLiveUrlFill(store, snapshots, {
      apply: true,
      maxPerRun: 50,
      onlyProjectId: 2,
    });

    expect(applied).toEqual([2]);
    expect(res.filled).toBe(1);
    expect(res.patches.map((p) => p.slug)).toEqual(['beta']);
  });

  it('still sweeps everything when no project is named (cron / manual path)', async () => {
    const { store, applied } = fakeStore();

    await runLiveUrlFill(store, snapshots, { apply: true, maxPerRun: 50 });

    expect(applied).toEqual([1, 2, 3]);
  });

  it('applies nothing when the named project is not a candidate', async () => {
    const { store, applied } = fakeStore();

    const res = await runLiveUrlFill(store, snapshots, {
      apply: true,
      maxPerRun: 50,
      onlyProjectId: 999,
    });

    expect(applied).toEqual([]);
    expect(res.candidates).toBe(0);
  });
});
