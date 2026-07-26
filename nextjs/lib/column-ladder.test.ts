/**
 * Remembering which column set the database accepts (#207, the "also in scope" half).
 *
 * Measured on production: `/projects` took 3.2–3.7 s on every uncached read because the ladder tries
 * the richest column set first and prod is missing `gh_private` / overview columns, so **three
 * selects fail before one succeeds**. Migrations 0032/0033 are parked awaiting authorization, so the
 * window this ladder was built for (#198) is open indefinitely — and the per-request cost is real
 * money. This fixes it without touching the database, which is why #207 says to do it regardless of
 * which auto-migrate option eventually wins.
 */
import { describe, expect, it } from 'bun:test';
import { createColumnLadder, LADDER_MEMO_TTL_MS } from './column-ladder';

const ATTEMPTS = ['rich', 'medium', 'poor'] as const;

describe('createColumnLadder (#207)', () => {
  it('starts with the given order, richest first', () => {
    expect([...createColumnLadder(ATTEMPTS).order()]).toEqual([
      'rich',
      'medium',
      'poor',
    ]);
  });

  it('puts the remembered winner first, so the failing attempts are paid once', () => {
    const ladder = createColumnLadder(ATTEMPTS);

    ladder.remember('poor');

    expect(ladder.order()[0]).toBe('poor');
  });

  it('keeps every other attempt available after remembering', () => {
    // Not a collapse to the winner: if the remembered set starts failing — a column dropped, a
    // different replica — the ladder must still be able to walk the rest instead of giving up.
    const ladder = createColumnLadder(ATTEMPTS);

    ladder.remember('medium');

    expect([...ladder.order()].sort()).toEqual([...ATTEMPTS].sort());
    expect(ladder.order()).toHaveLength(3);
  });

  it('re-probes the richest set once the memo expires', () => {
    // The trap this TTL removes: a migration lands, so a richer set would now succeed, but a
    // long-lived process keeps using the poorer one it memoised and the new column stays invisible
    // until a cold start. #207's whole point is that applying a migration should not need a human —
    // waiting for a redeploy to see its effect would put one back.
    let clock = 1_000;
    const ladder = createColumnLadder(ATTEMPTS, { now: () => clock });
    ladder.remember('poor');
    expect(ladder.order()[0]).toBe('poor');

    clock += LADDER_MEMO_TTL_MS + 1;

    expect([...ladder.order()]).toEqual(['rich', 'medium', 'poor']);
  });

  it('keeps the memo for the whole TTL, not just one call', () => {
    let clock = 1_000;
    const ladder = createColumnLadder(ATTEMPTS, { now: () => clock });
    ladder.remember('poor');

    clock += LADDER_MEMO_TTL_MS - 1;

    expect(ladder.order()[0]).toBe('poor');
  });

  it('ignores a winner that is not one of the attempts', () => {
    // Defensive: a caller passing a select string built somewhere else must not be able to insert an
    // attempt the ladder never offered.
    const ladder = createColumnLadder(ATTEMPTS);

    ladder.remember('something-else' as (typeof ATTEMPTS)[number]);

    expect([...ladder.order()]).toEqual(['rich', 'medium', 'poor']);
  });

  it('re-remembering a different winner replaces the previous one', () => {
    const ladder = createColumnLadder(ATTEMPTS);

    ladder.remember('poor');
    ladder.remember('medium');

    expect(ladder.order()[0]).toBe('medium');
  });
});
