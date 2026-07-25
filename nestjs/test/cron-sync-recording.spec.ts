/**
 * The hourly refresh must record that it reached a project (#223).
 *
 * #221 made every applied `runPipelineSync` record, which covers the event-driven paths only — a
 * GitHub push and a Vercel deploy. `refreshAll` calls `syncRepoDetail` directly and wrote no project
 * row, so a repo nobody pushed to read stale however healthy its sync was, and `isSyncUnhealthy`'s
 * `stuck` reason could not be alerted on without firing for every quiet project.
 */
import { describe, it, expect } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { DrizzleDB } from '../src/database/database.module';
import { PgPipelineSyncStore } from '../src/github/pg-pipeline-sync.store';
import {
  GithubRefreshService,
  type DetailSyncer,
  type RepoSyncOutcomeRecorder,
  type ResourceSyncer,
} from '../src/github/github-refresh.service';

const syncer: ResourceSyncer = {
  syncResource: async () => ({ changed: false, data: {} }),
};

function detailSyncer(
  failFor: string[] = [],
): DetailSyncer & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    syncUserProfile: async () => {},
    syncRepoDetail: async (owner: string, repo: string) => {
      calls.push(`${owner}/${repo}`);
      if (failFor.includes(`${owner}/${repo}`)) throw new Error('http-502');
      return { readmeSha: 'sha', readmeMissing: false };
    },
  };
}

interface Recorded {
  owner: string;
  repo: string;
  atIso: string;
  error: string | null;
}

function fakeRecorder(): {
  recorder: RepoSyncOutcomeRecorder;
  calls: Recorded[];
} {
  const calls: Recorded[] = [];
  return {
    calls,
    recorder: {
      recordSyncOutcomeByRepo: async (owner, repo, atIso, error) => {
        calls.push({ owner, repo, atIso, error });
      },
    },
  };
}

/** No members and no org resources, so only the showcase detail loop runs. */
function service(
  detail: DetailSyncer,
  recorder: RepoSyncOutcomeRecorder | undefined,
  repos: { owner: string; repo: string }[],
): GithubRefreshService {
  return new GithubRefreshService(
    syncer,
    [],
    'Slow-Inc',
    detail,
    repos,
    undefined,
    recorder,
  );
}

describe('refreshAll records the repos it reached (#223)', () => {
  it('records a repo the run reached even though nothing changed', async () => {
    // The whole point: a healthy repo returns 304 for weeks. `syncResource` skips the upsert on a
    // 304, which is why the snapshot timestamp cannot answer "did a run reach this repo".
    const detail = detailSyncer();
    const { recorder, calls } = fakeRecorder();

    await service(detail, recorder, [
      { owner: 'Slow-Inc', repo: 'Demo' },
    ]).refreshAll();

    expect(detail.calls).toEqual(['Slow-Inc/Demo']);
    expect(calls).toHaveLength(1);
    expect(calls[0].owner).toBe('Slow-Inc');
    expect(calls[0].repo).toBe('Demo');
    expect(calls[0].error).toBeNull();
    expect(Number.isNaN(Date.parse(calls[0].atIso))).toBe(false);
  });

  it('records the error for a repo whose detail sync threw', async () => {
    const detail = detailSyncer(['Slow-Inc/Broken']);
    const { recorder, calls } = fakeRecorder();

    const summary = await service(detail, recorder, [
      { owner: 'Slow-Inc', repo: 'Broken' },
      { owner: 'Slow-Inc', repo: 'Fine' },
    ]).refreshAll();

    // Fail-soft is preserved: the failure is recorded and the batch continues.
    expect(summary.failed).toHaveLength(1);
    expect(detail.calls).toEqual(['Slow-Inc/Broken', 'Slow-Inc/Fine']);
    expect(calls.map((c) => `${c.repo}:${c.error ?? 'ok'}`)).toEqual([
      'Broken:http-502',
      'Fine:ok',
    ]);
  });

  it('a recorder that throws never breaks the refresh', async () => {
    // Bookkeeping must not cost a refresh that did its work. The contract says implementations do
    // not throw; this pins what happens when one does anyway.
    const detail = detailSyncer();
    const recorder: RepoSyncOutcomeRecorder = {
      recordSyncOutcomeByRepo: async () => {
        throw new Error('pooler gone');
      },
    };

    const summary = await service(detail, recorder, [
      { owner: 'Slow-Inc', repo: 'Demo' },
    ]).refreshAll();

    expect(summary.synced).toContain('repo:Slow-Inc/Demo:contributors');
    expect(summary.failed).toEqual([]);
  });

  it('records by GitHub identity, case-insensitively, and clears a stale error', async () => {
    // The loop has no project id, and `projects.gh_repo` casing can differ from what the refresh
    // was handed, so matching on exact case would silently update zero rows — the failure mode is a
    // row that looks unreached forever while the sync is fine.
    const calls: { text: string; params: unknown[] }[] = [];
    const db = {
      execute: (q: unknown) => {
        const { sql: text, params } = new PgDialect().sqlToQuery(
          q as Parameters<PgDialect['sqlToQuery']>[0],
        );
        calls.push({ text: text.toLowerCase(), params });
        return Promise.resolve([]);
      },
    } as unknown as DrizzleDB;

    await new PgPipelineSyncStore(db).recordSyncOutcomeByRepo(
      'Slow-Inc',
      'Demo',
      '2026-07-26T12:00:00.000Z',
      null,
    );

    expect(calls[0].text).toContain('lower(gh_owner)');
    expect(calls[0].text).toContain('lower(gh_repo)');
    expect(calls[0].text).toContain("source = 'github'");
    expect(calls[0].params).toEqual([
      '2026-07-26T12:00:00.000Z',
      null,
      'Slow-Inc',
      'Demo',
    ]);
  });

  it('a successful pass CLEARS an error an earlier pipeline run recorded — deliberately', async () => {
    // `last_sync_error` is one slot and means "the most recent attempt's error", so the most recent
    // writer wins: a cron pass that succeeds at 10:52 erases a push-time action failure from 10:05.
    // That is the column's semantics, not an accident — but it means this column cannot be the
    // durable detector for a failed *enrichment*. #222's content invariant is, because it reads the
    // outcome (the field is still empty) instead of who last failed. Pinned so nobody builds a
    // daily alert on this column expecting it to remember.
    const detail = detailSyncer();
    const { recorder, calls } = fakeRecorder();

    await service(detail, recorder, [
      { owner: 'Slow-Inc', repo: 'Demo' },
    ]).refreshAll();

    expect(calls[0].error).toBeNull();
  });

  it('works unchanged with no recorder injected', async () => {
    const detail = detailSyncer();

    const summary = await service(detail, undefined, [
      { owner: 'Slow-Inc', repo: 'Demo' },
    ]).refreshAll();

    expect(summary.failed).toEqual([]);
    expect(detail.calls).toEqual(['Slow-Inc/Demo']);
  });
});
