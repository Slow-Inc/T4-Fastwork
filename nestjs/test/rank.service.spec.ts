import { describe, it, expect } from 'bun:test';
import { RankService } from '../src/rank/rank.service.ts';
import type {
  RankStore,
  RankCandidate,
  RankRow,
  RankKind,
} from '../src/rank/rank.ts';

class FakeStore implements RankStore {
  applied: { kind: RankKind; rows: RankRow[] }[] = [];
  constructor(private readonly byKind: Partial<Record<RankKind, RankCandidate[]>>) {}
  async getCandidates(kind: RankKind): Promise<RankCandidate[]> {
    return this.byKind[kind] ?? [];
  }
  async applyRanks(kind: RankKind, rows: RankRow[]): Promise<void> {
    this.applied.push({ kind, rows });
  }
}

describe('RankService.refresh', () => {
  it('ranks the candidates and persists the ai_rank rows in order', async () => {
    const store = new FakeStore({
      projects: [
        { id: 'p1', title: 'One' },
        { id: 'p2', title: 'Two' },
      ],
    });
    const client = async () => '[{"id":"p2","rationale":"bigger impact"},{"id":"p1"}]';
    const svc = new RankService(store, client);

    await svc.refresh('projects');

    expect(store.applied).toEqual([
      {
        kind: 'projects',
        rows: [
          { id: 'p2', aiRank: 0, aiRankRationale: 'bigger impact' },
          { id: 'p1', aiRank: 1 },
        ],
      },
    ]);
  });

  it('does not persist (keeps existing ranks) when the LLM call fails', async () => {
    const store = new FakeStore({ projects: [{ id: 'p1', title: 'One' }] });
    const client = async () => {
      throw new Error('gateway down');
    };
    const svc = new RankService(store, client);

    await svc.refresh('projects'); // must not throw

    expect(store.applied).toEqual([]);
  });

  it('skips the LLM entirely when there are no candidates', async () => {
    const store = new FakeStore({ projects: [] });
    let called = false;
    const client = async () => {
      called = true;
      return '[]';
    };
    const svc = new RankService(store, client);

    await svc.refresh('projects');

    expect(called).toBe(false);
    expect(store.applied).toEqual([]);
  });
});
