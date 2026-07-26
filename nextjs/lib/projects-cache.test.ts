/**
 * Caching the project list must never cache a FAILURE (#234, guardrail from the brainstorm round).
 *
 * `getAllProjects()` has always swallowed errors and returned `[]`, which is correct for the page —
 * a visitor gets an empty list instead of a crash. But it makes "Supabase hiccuped" and "there are no
 * published projects" the same value, and once that value is stored in a durable cache the page stays
 * blank for the whole TTL. The fix is a boundary: the function that gets cached **throws** on failure,
 * and the swallow happens outside the cache.
 */
import { beforeEach, describe, expect, it, mock } from 'bun:test';

type Row = Record<string, unknown>;
let mode: 'ok' | 'empty' | 'ladder-exhausted' | 'throw' = 'ok';
const ROW: Row = {
  id: 1,
  slug: 'demo',
  title: 'Demo',
  status: 'published',
  source: 'github',
};

mock.module('./public-db', () => ({
  publicDb: () => ({
    from: () => ({
      select: () => {
        const result =
          mode === 'ok'
            ? { data: [ROW], error: null }
            : mode === 'empty'
              ? { data: [], error: null }
              : // A non-missing-column error makes the ladder give up entirely.
                { data: null, error: { code: 'XX000', message: 'pooler gone' } };
        const chain = {
          eq: () => chain,
          not: () => chain,
          order: () => {
            if (mode === 'throw') return Promise.reject(new Error('socket closed'));
            return Promise.resolve(result);
          },
          maybeSingle: () => {
            if (mode === 'throw') return Promise.reject(new Error('socket closed'));
            return Promise.resolve(result);
          },
        };
        return chain;
      },
    }),
  }),
}));

const { fetchPublishedProjects, getAllProjects } = await import('./projects-repo');

describe('fetchPublishedProjects — the cacheable read (#234)', () => {
  beforeEach(() => {
    mode = 'ok';
  });

  it('returns the mapped rows on success', async () => {
    const rows = await fetchPublishedProjects();
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('demo');
  });

  it('returns an empty list when the query succeeds with no rows — that IS cacheable', async () => {
    // Genuinely zero published projects is a real answer, not a failure. Caching it is correct.
    mode = 'empty';
    expect(await fetchPublishedProjects()).toEqual([]);
  });

  it('THROWS when the select ladder gives up, instead of returning an empty list', async () => {
    // The whole point: a failure must be distinguishable from "no projects" so the cache never
    // stores it. If this returned [], a transient pooler error would blank /projects for the TTL.
    mode = 'ladder-exhausted';
    await expect(fetchPublishedProjects()).rejects.toThrow();
  });

  it('propagates a thrown driver error rather than swallowing it', async () => {
    mode = 'throw';
    await expect(fetchPublishedProjects()).rejects.toThrow('socket closed');
  });
});

describe('getAllProjects — the page-facing wrapper (#234)', () => {
  beforeEach(() => {
    mode = 'ok';
  });

  it('still degrades to an empty list so the page renders instead of crashing', async () => {
    // Unchanged behaviour for callers. The difference is only WHERE the swallow happens: outside the
    // cache, so the empty result of a failure is never persisted.
    mode = 'ladder-exhausted';
    expect(await getAllProjects()).toEqual([]);

    mode = 'throw';
    expect(await getAllProjects()).toEqual([]);
  });

  it('returns projects on success', async () => {
    const all = await getAllProjects();
    expect(all.map((p) => p.slug)).toEqual(['demo']);
  });

  it('a failure is not sticky — the next successful read returns data', async () => {
    // Guards the structural property that makes the durable cache safe: only successes ever reach it,
    // because the swallow lives outside the boundary. If someone moves the catch back inside
    // `fetchPublishedProjects`, an `[]` becomes cacheable and this ordering starts mattering.
    // End-to-end durability across invocations cannot be asserted here (no Next request scope, no real
    // Data Cache) — that is #240's job, on production.
    mode = 'ladder-exhausted';
    expect(await getAllProjects()).toEqual([]);

    mode = 'ok';
    expect((await getAllProjects()).map((p) => p.slug)).toEqual(['demo']);
  });

  it('falls back to a DIRECT read when the cache layer itself fails, not to an empty page', async () => {
    // This test environment has no Next request scope, so `unstable_cache` cannot work here — which
    // makes it an honest stand-in for a cache-store outage in production. The wrong behaviour would be
    // to let the outer catch swallow that into `[]`: a broken cache would then look exactly like an
    // empty database and blank the page. Correct behaviour is slower, not emptier.
    const all = await getAllProjects();
    expect(all.map((p) => p.slug)).toEqual(['demo']);
  });
});
