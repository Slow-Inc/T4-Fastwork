/**
 * Detecting a project whose sync is stuck or failing (#193 / #185 S8).
 *
 * The pipeline is fail-soft by design: `runPipelineSync` reports failed actions and never throws
 * (`pipeline-sync.ts:69`), so a project can fail on every run while every run still returns a
 * success-shaped result. #211 was the same class of defect found by hand — a row nobody was
 * watching. This predicate is what makes it findable without anyone opening a page.
 */
import { describe, it, expect } from 'bun:test';
import {
  isSyncUnhealthy,
  unhealthyProjects,
  type ProjectSyncHealth,
} from '../src/github/sync-health';

const now = new Date('2026-07-26T12:00:00Z');
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
/**
 * How often a SINGLE project is expected to be reached — not the cron period. `refreshAll` rotates
 * 8 repos per hourly run over ~47 published github repos, so a project is revisited about every
 * 6 hours. Passing the 1-hour cron period would report almost every healthy project as stuck, which
 * is the footgun the last case below pins.
 */
const REVISIT_MS = 6 * 3_600_000;

function healthy(over: Partial<ProjectSyncHealth> = {}): ProjectSyncHealth {
  return {
    slug: 'mangadock',
    lastSyncedAt: hoursAgo(1),
    lastSyncError: null,
    ...over,
  };
}

describe('isSyncUnhealthy (#193)', () => {
  it('a recent sync with no error is healthy', () => {
    expect(isSyncUnhealthy(healthy(), REVISIT_MS, now)).toBeNull();
  });

  it('a recorded error is unhealthy even when the sync is recent', () => {
    // A run that failed an action still updates the timestamp, so freshness alone would hide it.
    const res = isSyncUnhealthy(
      healthy({ lastSyncError: 'sync_taxonomy: pooler gone' }),
      REVISIT_MS,
      now,
    );
    expect(res).toEqual({
      slug: 'mangadock',
      reason: 'error',
      detail: 'sync_taxonomy: pooler gone',
    });
  });

  it('a sync older than several revisit intervals is stuck, even with no error', () => {
    // The silent case: nothing failed loudly, the project simply stopped being reached.
    const res = isSyncUnhealthy(
      healthy({ lastSyncedAt: hoursAgo(24) }),
      REVISIT_MS,
      now,
    );
    expect(res?.reason).toBe('stuck');
    expect(res?.slug).toBe('mangadock');
  });

  it('a project that has never synced is stuck rather than silently ignored', () => {
    const res = isSyncUnhealthy(
      healthy({ lastSyncedAt: null }),
      REVISIT_MS,
      now,
    );
    expect(res?.reason).toBe('never');
  });

  it('a sync one revisit old is not yet stuck — a single missed run is normal drift', () => {
    // GitHub Actions schedules drift by tens of minutes; alerting on one late run would cry wolf.
    expect(
      isSyncUnhealthy(healthy({ lastSyncedAt: hoursAgo(7) }), REVISIT_MS, now),
    ).toBeNull();
  });

  it('a project reached within its rotation is healthy even though several cron runs have passed', () => {
    // The footgun this parameter name exists to prevent: the cron is hourly, but the detail sync
    // only reaches 8 of ~47 repos per run, so a 10-hour-old sync is normal for a rotating budget.
    // A caller that passed the 1-hour cron period instead would call this project stuck.
    expect(
      isSyncUnhealthy(healthy({ lastSyncedAt: hoursAgo(10) }), REVISIT_MS, now),
    ).toBeNull();
    expect(
      isSyncUnhealthy(healthy({ lastSyncedAt: hoursAgo(10) }), 3_600_000, now)
        ?.reason,
    ).toBe('stuck');
  });

  it('an error takes precedence over staleness, so the report names the actionable cause', () => {
    const res = isSyncUnhealthy(
      healthy({ lastSyncedAt: hoursAgo(48), lastSyncError: 'http-403' }),
      REVISIT_MS,
      now,
    );
    expect(res?.reason).toBe('error');
    expect(res?.detail).toBe('http-403');
  });
});

describe('unhealthyProjects (#193)', () => {
  it('reports only the unhealthy rows, preserving input order', () => {
    const res = unhealthyProjects(
      [
        healthy({ slug: 'fine' }),
        healthy({ slug: 'broken', lastSyncError: 'boom' }),
        healthy({ slug: 'stale', lastSyncedAt: hoursAgo(30) }),
      ],
      REVISIT_MS,
      now,
    );
    expect(res.map((r) => r.slug)).toEqual(['broken', 'stale']);
  });

  it('returns nothing when every project is healthy, so a quiet run stays quiet', () => {
    expect(unhealthyProjects([healthy(), healthy()], REVISIT_MS, now)).toEqual(
      [],
    );
  });
});
