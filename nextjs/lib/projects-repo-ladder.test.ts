/**
 * The measured cost #207 is about: `/projects` walked three failing selects on EVERY uncached read.
 *
 * This asserts the behaviour that fixes it — the second read pays one select, not four — through the
 * repo's public functions rather than by inspecting the ladder, so the wiring is what is verified.
 */
import { beforeEach, describe, expect, it, mock } from 'bun:test';

/** Column sets the fake database rejects, standing in for prod missing 0032/0033. */
const UNKNOWN = ['gh_private', 'overview_summary', 'used_for'];

const attempted: string[] = [];

function fakeQuery(select: string) {
  const rejects = UNKNOWN.some((c) => select.includes(c));
  const result = rejects
    ? { data: null, error: { code: '42703', message: `column ${select.match(/gh_private|overview_summary|used_for/)?.[0]} does not exist` } }
    : { data: [], error: null };
  const chain = {
    eq: () => chain,
    not: () => chain,
    order: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
  };
  return chain;
}

mock.module('./public-db', () => ({
  publicDb: () => ({
    from: () => ({
      select: (select: string) => {
        attempted.push(select);
        return fakeQuery(select);
      },
    }),
  }),
}));

const { getAllProjects } = await import('./projects-repo');

describe('the project select ladder is paid once per process (#207)', () => {
  beforeEach(() => {
    attempted.length = 0;
  });

  // One test, not two: the memo lives at module scope — that is the whole point, since a serverless
  // instance serves many requests — so a split test would inherit the first one's memo and its
  // "first read" assertion would silently become a second read. Asserting both facts in sequence
  // here keeps the test honest about the state it owns.
  it('walks the ladder once, then issues ONE select per read', async () => {
    await getAllProjects();

    // Prod rejects everything mentioning the unapplied columns, so the winner is a later attempt.
    const firstCount = attempted.length;
    expect(firstCount).toBeGreaterThan(1);
    const winner = attempted[firstCount - 1];
    expect(UNKNOWN.some((c) => winner.includes(c))).toBe(false);

    attempted.length = 0;
    await getAllProjects();

    expect(attempted).toEqual([winner]);
  });

  it('a detail read reuses the same remembered set', async () => {
    // `getProjectBySlug` shares the ladder, so it must not re-walk it either.
    const { getProjectBySlug } = await import('./projects-repo');

    await getProjectBySlug('mangadock');

    expect(attempted).toHaveLength(1);
    expect(UNKNOWN.some((c) => attempted[0].includes(c))).toBe(false);
  });
});
