/**
 * The scheduled report that makes a failing or stuck sync visible (#193 AC3).
 *
 * The notify path is deliberately the logs: #193 names `scripts/notify.ps1`, which does not exist
 * (`grep -rln notify nestjs/src` is empty), so "the existing notify path" can only mean what the repo
 * actually does — a `logger.warn` surfaced by the cron run, the same shape #214/#216/#222 established.
 * Building a Slack/email channel would be new infrastructure this issue never asked for.
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import { GithubWriteController } from '../src/github/github-write.controller';
import type { ProjectSyncHealth } from '../src/github/sync-health';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { DrizzleDB } from '../src/database/database.module';
import { PgShowcaseRepoStore } from '../src/github/pg-showcase-repos.store';
import { revisitIntervalMs } from '../src/github/sync-health';

/** Postgres undefined_column, as the driver surfaces it. */
function undefinedColumn(column: string): Error & { code: string } {
  const err = new Error(
    `column "${column}" of relation "projects" does not exist`,
  ) as Error & { code: string };
  err.code = '42703';
  return err;
}

function fakeDb(handler: (text: string) => unknown) {
  const calls: string[] = [];
  const db = {
    execute: (q: unknown) => {
      const { sql: text } = new PgDialect().sqlToQuery(
        q as Parameters<PgDialect['sqlToQuery']>[0],
      );
      calls.push(text.toLowerCase());
      const res = handler(text.toLowerCase());
      return res instanceof Error ? Promise.reject(res) : Promise.resolve(res);
    },
  } as unknown as DrizzleDB;
  return { db, calls };
}

describe('revisitIntervalMs (#193)', () => {
  it('derives the interval from the rotation, not from the cron period', () => {
    // The footgun this exists to remove: `refreshAll` reaches a budget of 8 repos per hourly run, so
    // with 47 repos a single project is revisited every 6 runs — passing the 1-hour cron period
    // would report almost every healthy project as stuck.
    expect(revisitIntervalMs(47, 8, 3_600_000)).toBe(6 * 3_600_000);
  });

  it('rounds up, because a partial rotation still costs a whole run', () => {
    expect(revisitIntervalMs(9, 8, 3_600_000)).toBe(2 * 3_600_000);
  });

  it('is one cron period when the budget covers every repo', () => {
    expect(revisitIntervalMs(8, 8, 3_600_000)).toBe(3_600_000);
    expect(revisitIntervalMs(3, 8, 3_600_000)).toBe(3_600_000);
  });

  it('never returns zero for an empty showcase, which would mark everything stuck', () => {
    // An empty or unreadable repo list must not collapse the threshold to 0 — that would make every
    // project instantly stale and turn the alert into noise on the one run where the query failed.
    expect(revisitIntervalMs(0, 8, 3_600_000)).toBe(3_600_000);
  });

  it('survives a nonsense budget instead of dividing by zero', () => {
    expect(revisitIntervalMs(47, 0, 3_600_000)).toBe(3_600_000);
  });
});

function controller(health: ProjectSyncHealth[] | null): GithubWriteController {
  const projects = { listProjectSyncHealth: async () => health };
  return new GithubWriteController(
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never,
    projects as never,
  );
}

const NOW = new Date('2026-07-26T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

describe('POST /github/report-sync-health (#193 AC3)', () => {
  const prev = process.env.GITHUB_REFRESH_SECRET;
  beforeEach(() => {
    process.env.GITHUB_REFRESH_SECRET = 'topsecret';
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.GITHUB_REFRESH_SECRET;
    else process.env.GITHUB_REFRESH_SECRET = prev;
  });

  it('rejects a wrong secret', async () => {
    await expect(
      controller([]).doReportSyncHealth('nope'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('reports NOT ASSESSABLE instead of 47 stuck projects when 0034 is unapplied', async () => {
    const res = await controller(null).doReportSyncHealth('topsecret');

    expect(res.assessable).toBe(false);
    expect(res.unhealthy).toEqual([]);
    expect(res.reason).toContain('0034');
  });

  it('reports a recorded error and a stale project, and stays quiet otherwise', async () => {
    const rows: ProjectSyncHealth[] = [
      { slug: 'fine', lastSyncedAt: hoursAgo(2), lastSyncError: null },
      { slug: 'broken', lastSyncedAt: hoursAgo(1), lastSyncError: 'http-502' },
      { slug: 'stale', lastSyncedAt: hoursAgo(100), lastSyncError: null },
    ];

    const res = await controller(rows).doReportSyncHealth('topsecret', NOW);

    expect(res.assessable).toBe(true);
    expect(res.scanned).toBe(3);
    expect(res.unhealthy.map((u) => `${u.slug}:${u.reason}`)).toEqual([
      'broken:error',
      'stale:stuck',
    ]);
  });

  it('derives the threshold from the rotation, so a quiet-but-reached project is healthy', async () => {
    // 3 rows fit inside one 8-repo run, so the interval is one cron period and `STUCK_AFTER_REVISITS`
    // gives a 3-hour grace. A 2-hour-old sync must stay healthy; the same row at 100 hours must not.
    const res = await controller([
      { slug: 'quiet', lastSyncedAt: hoursAgo(2), lastSyncError: null },
      { slug: 'a', lastSyncedAt: hoursAgo(1), lastSyncError: null },
      { slug: 'b', lastSyncedAt: hoursAgo(1), lastSyncError: null },
    ]).doReportSyncHealth('topsecret', NOW);

    expect(res.unhealthy).toEqual([]);
  });

  it('an empty showcase reports nothing rather than dividing by zero', async () => {
    const res = await controller([]).doReportSyncHealth('topsecret', NOW);

    expect(res.assessable).toBe(true);
    expect(res.scanned).toBe(0);
    expect(res.unhealthy).toEqual([]);
  });
});

describe('PgShowcaseRepoStore.listProjectSyncHealth (#193)', () => {
  it('returns null when the columns do not exist yet, which is NOT "everything is stuck"', async () => {
    // 0034 is parked behind the production-write gate, so this ships before its columns. A report
    // that read a missing column as "no data" would call all 47 projects `never` on every run —
    // the loudest possible alert at the moment it knows the least.
    const { db, calls } = fakeDb(() => undefinedColumn('last_synced_at'));

    const res = await new PgShowcaseRepoStore(db).listProjectSyncHealth();

    expect(res).toBeNull();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('last_synced_at');
  });

  it('maps the rows the predicate reads, including a never-synced one', async () => {
    const { db } = fakeDb(() => [
      {
        slug: 'fine',
        last_synced_at: new Date('2026-07-26T11:00:00Z'),
        last_sync_error: null,
      },
      { slug: 'fresh', last_synced_at: null, last_sync_error: null },
      {
        slug: 'broken',
        last_synced_at: new Date('2026-07-26T11:00:00Z'),
        last_sync_error: 'sync_taxonomy: http-502',
      },
    ]);

    const res = await new PgShowcaseRepoStore(db).listProjectSyncHealth();

    expect(res?.map((r) => r.slug)).toEqual(['fine', 'fresh', 'broken']);
    expect(res?.[0].lastSyncedAt).toBeInstanceOf(Date);
    expect(res?.[1].lastSyncedAt).toBeNull();
    expect(res?.[2].lastSyncError).toBe('sync_taxonomy: http-502');
  });

  it('rethrows an error that is not a missing column, rather than reporting all-clear', async () => {
    // Swallowing a pooler outage would produce an empty unhealthy list — a silent all-clear, which
    // is the failure mode this whole issue exists to remove.
    const { db } = fakeDb(() => new Error('pooler gone'));

    await expect(
      new PgShowcaseRepoStore(db).listProjectSyncHealth(),
    ).rejects.toThrow('pooler gone');
  });
});
