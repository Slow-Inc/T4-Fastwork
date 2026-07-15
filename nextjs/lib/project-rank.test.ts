import { describe, it, expect } from 'bun:test';
import { orderByRank } from './project-rank';

const item = (slug: string) => ({ slug, name: slug.toUpperCase() });

describe('orderByRank', () => {
  it('orders items by their ai_rank (ascending)', () => {
    const items = [item('a'), item('b'), item('c')];
    const rank = new Map([
      ['a', 2],
      ['b', 0],
      ['c', 1],
    ]);
    expect(orderByRank(items, rank).map((i) => i.slug)).toEqual(['b', 'c', 'a']);
  });

  it('puts unranked items last, preserving their original order', () => {
    const items = [item('a'), item('b'), item('c'), item('d')];
    const rank = new Map([
      ['c', 0],
      ['a', 1],
    ]);
    // ranked first (c, a), then the unranked in original order (b, d).
    expect(orderByRank(items, rank).map((i) => i.slug)).toEqual([
      'c',
      'a',
      'b',
      'd',
    ]);
  });

  it('is stable for equal ranks (keeps original order)', () => {
    const items = [item('a'), item('b'), item('c')];
    const rank = new Map([
      ['a', 0],
      ['b', 0],
      ['c', 0],
    ]);
    expect(orderByRank(items, rank).map((i) => i.slug)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('returns the input order when the rank map is empty', () => {
    const items = [item('x'), item('y')];
    expect(orderByRank(items, new Map()).map((i) => i.slug)).toEqual(['x', 'y']);
  });
});
