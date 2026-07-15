import { describe, it, expect } from 'bun:test';
import {
  parseRanking,
  buildRankMessages,
  rankCandidates,
  ranksToRows,
} from '../src/rank/rank.ts';

describe('parseRanking', () => {
  it('orders known ids by the LLM response and appends any it omitted', () => {
    const raw = '[{"id":"b","rationale":"strong outcome"},{"id":"a"}]';
    expect(parseRanking(raw, ['a', 'b', 'c'])).toEqual([
      { id: 'b', rationale: 'strong outcome' },
      { id: 'a' },
      { id: 'c' },
    ]);
  });

  it('degrades to the input order when the response is malformed', () => {
    expect(parseRanking('not json at all', ['a', 'b'])).toEqual([
      { id: 'a' },
      { id: 'b' },
    ]);
  });

  it('drops unknown ids and de-duplicates repeats', () => {
    const raw = '[{"id":"x"},{"id":"a"},{"id":"a"}]';
    expect(parseRanking(raw, ['a', 'b'])).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
});

describe('buildRankMessages', () => {
  it('builds a system rubric prompt for the kind + a user payload of every candidate', () => {
    const messages = buildRankMessages('certificates', [
      { id: 'c1', title: 'AI for All', signals: { issuer: 'NVIDIA' } },
      { id: 'c2', title: 'Road to Data Scientists' },
    ]);
    expect(messages[0].role).toBe('system');
    const system = messages[0].content as string;
    expect(system.toLowerCase()).toContain('credibility');
    expect(system).toContain('certificates');
    expect(messages[1].role).toBe('user');
    const user = messages[1].content as string;
    expect(user).toContain('c1');
    expect(user).toContain('c2');
    expect(user).toContain('AI for All');
  });
});

describe('rankCandidates', () => {
  it('ranks via the injected client and never drops a candidate', async () => {
    const client = async () => '[{"id":"p2"},{"id":"p1"}]';
    const out = await rankCandidates(client, 'projects', [
      { id: 'p1', title: 'One' },
      { id: 'p2', title: 'Two' },
      { id: 'p3', title: 'Three' },
    ]);
    expect(out).toEqual([{ id: 'p2' }, { id: 'p1' }, { id: 'p3' }]);
  });

  it('returns [] without calling the client when there are no candidates', async () => {
    let called = false;
    const client = async () => {
      called = true;
      return '[]';
    };
    expect(await rankCandidates(client, 'projects', [])).toEqual([]);
    expect(called).toBe(false);
  });
});

describe('ranksToRows', () => {
  it('maps position to ai_rank (0-based) and carries the rationale', () => {
    expect(
      ranksToRows([{ id: 'b', rationale: 'strong' }, { id: 'a' }]),
    ).toEqual([
      { id: 'b', aiRank: 0, aiRankRationale: 'strong' },
      { id: 'a', aiRank: 1 },
    ]);
  });
});
