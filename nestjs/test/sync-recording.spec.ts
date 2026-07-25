/**
 * Recording that a run REACHED a project, so `isSyncUnhealthy` has something to read (#193).
 *
 * The reason this cannot reuse `github_snapshots.updated_at`: `syncResource` deliberately skips
 * the upsert on a 304 (`github.service.ts:100-102`), so that timestamp means "content last
 * changed", not "a run last reached this repo". A recorder that only wrote when something changed
 * would inherit the same blind spot and report every stable repo as stuck.
 */
import { describe, it, expect } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { DrizzleDB } from '../src/database/database.module';
import { PgPipelineSyncStore } from '../src/github/pg-pipeline-sync.store';
import { PipelinePushRunner } from '../src/github/pipeline-push-runner';
import {
  runPipelineSync,
  type PipelineActionExecutor,
  type PipelineStateLoader,
  type PipelineSyncRecorder,
  WEBHOOK_DEFERRED_ACTIONS,
} from '../src/github/pipeline-sync';
import type {
  ProjectSyncState,
  SyncEvent,
} from '../src/github/project-automation-sync';

const NOW_ISO = '2026-07-26T12:00:00.000Z';
const NOW = Date.parse(NOW_ISO);

/** A row nothing needs doing to: every auto-filled field present, cover already captured. */
function current(over: Partial<ProjectSyncState> = {}): ProjectSyncState {
  return {
    id: 7,
    slug: 'demo',
    status: 'published',
    source: 'github',
    isPublicRepo: true,
    ghOwner: 'Slow-Inc',
    ghRepo: 'Demo',
    liveUrl: 'https://demo.example',
    snapshotImage: 'https://cdn.example/cover.png',
    readmeSha: 'same',
    snapshotReadmeSha: 'same',
    content: 'filled',
    contentOwner: 'auto',
    categoryId: 3,
    categoryOwner: 'auto',
    tagsOwner: 'auto',
    technologiesOwner: 'auto',
    overviewSummary: 'a summary',
    overviewOwner: 'auto',
    // Matches captureTrigger(push()) below, so the cover is already up to date.
    lastCaptureTrigger: 'push:deadbeef',
    lastCaptureDispatchAt: '2026-07-26T11:00:00.000Z',
    ...over,
  };
}

function push(over: Partial<SyncEvent> = {}): SyncEvent {
  return {
    kind: 'github_push',
    owner: 'Slow-Inc',
    repo: 'Demo',
    headSha: 'deadbeef',
    isDefaultBranch: true,
    ...over,
  };
}

function loaderOf(state: ProjectSyncState | null): PipelineStateLoader {
  return { loadByGithub: async () => state };
}

const noopExecutor: PipelineActionExecutor = {
  syncLiveUrl: async () => {},
  syncTaxonomy: async () => {},
  syncOverview: async () => {},
  regenCaseStudy: async () => {},
  autoPublish: async () => {},
  recaptureCover: async () => {},
  rank: async () => {},
  revalidate: async () => {},
};

interface RecordedCall {
  projectId: number;
  atIso: string;
  error: string | null;
}

function fakeRecorder(): {
  recorder: PipelineSyncRecorder;
  calls: RecordedCall[];
} {
  const calls: RecordedCall[] = [];
  return {
    calls,
    recorder: {
      recordSyncOutcome: async (projectId, atIso, error) => {
        calls.push({ projectId, atIso, error });
      },
    },
  };
}

describe('recording a pipeline run (#193)', () => {
  it('records a run that reached the project even when it had nothing to do', async () => {
    // The whole point: a healthy repo plans nothing for weeks. If only changed runs recorded,
    // this row would age past the stuck threshold and the alert would fire on a working project.
    const { recorder, calls } = fakeRecorder();

    const res = await runPipelineSync(
      push(),
      { apply: true, now: NOW },
      loaderOf(current()),
      noopExecutor,
      recorder,
    );

    // Guard: assert this really is the no-op case, or the test above proves nothing.
    expect(res.plan).toEqual([]);
    expect(res.executed).toEqual([]);
    expect(calls).toEqual([{ projectId: 7, atIso: NOW_ISO, error: null }]);
  });

  it('records a failing action by name, because the reason is what an operator acts on', async () => {
    const { recorder, calls } = fakeRecorder();
    const executor: PipelineActionExecutor = {
      ...noopExecutor,
      syncTaxonomy: async () => {
        throw new Error('pooler gone');
      },
    };

    const res = await runPipelineSync(
      push(),
      { apply: true, now: NOW },
      loaderOf(current({ categoryId: null })),
      executor,
      recorder,
    );

    expect(res.failed.map((f) => f.action)).toEqual(['sync_taxonomy']);
    expect(calls).toEqual([
      { projectId: 7, atIso: NOW_ISO, error: 'sync_taxonomy: pooler gone' },
    ]);
  });

  it('records every failing action, not just the first', async () => {
    // The pipeline isolates actions so one throw does not cancel the rest (#200). Recording only
    // the first would hide a second, unrelated breakage behind the one someone already fixed.
    const { recorder, calls } = fakeRecorder();
    const executor: PipelineActionExecutor = {
      ...noopExecutor,
      syncLiveUrl: async () => {
        throw new Error('vercel 500');
      },
      syncTaxonomy: async () => {
        throw new Error('pooler gone');
      },
    };

    await runPipelineSync(
      push(),
      { apply: true, now: NOW },
      loaderOf(current({ liveUrl: null, categoryId: null })),
      executor,
      recorder,
    );

    expect(calls[0].error).toBe(
      'sync_live_url: vercel 500; sync_taxonomy: pooler gone',
    );
  });

  it('records nothing for a dry run, which reached nothing', async () => {
    const { recorder, calls } = fakeRecorder();

    await runPipelineSync(
      push(),
      { apply: false, now: NOW },
      loaderOf(current({ categoryId: null })),
      noopExecutor,
      recorder,
    );

    expect(calls).toEqual([]);
  });

  it('records nothing when no project matches the repo', async () => {
    // There is no row to record against, and inventing one would report a repo we do not track.
    const { recorder, calls } = fakeRecorder();

    const res = await runPipelineSync(
      push(),
      { apply: true, now: NOW },
      loaderOf(null),
      noopExecutor,
      recorder,
    );

    expect(res.found).toBe(false);
    expect(calls).toEqual([]);
  });

  it('treats a deferred action as healthy, not as a failure', async () => {
    // Every webhook run defers the three LLM actions to the cron drain (#199). Counting deferral
    // as an error would mark every pushed repo unhealthy and bury the real failures.
    const { recorder, calls } = fakeRecorder();

    const res = await runPipelineSync(
      push(),
      { apply: true, now: NOW, deferred: WEBHOOK_DEFERRED_ACTIONS },
      loaderOf(current({ categoryId: null })),
      noopExecutor,
      recorder,
    );

    expect(res.deferred).toContain('sync_taxonomy');
    expect(calls).toEqual([{ projectId: 7, atIso: NOW_ISO, error: null }]);
  });
});

// No live DB — capture + render the emitted SQL (mirrors pg-case-study-simple-store.spec).
function fakeDb(result: unknown[] = []) {
  const calls: { text: string; params: unknown[] }[] = [];
  const execute = (q: unknown) => {
    const { sql: text, params } = new PgDialect().sqlToQuery(
      q as Parameters<PgDialect['sqlToQuery']>[0],
    );
    calls.push({ text: text.toLowerCase(), params });
    return Promise.resolve(result);
  };
  return { db: { execute } as unknown as DrizzleDB, calls };
}

describe('the push path records (#193)', () => {
  it('a push through PipelinePushRunner records the run against the project', async () => {
    // The predicate is only worth anything if the path that runs on every push feeds it.
    const { recorder, calls } = fakeRecorder();
    const store = {
      runExclusive: async <T>(_l: string, fn: () => Promise<T>) => ({
        ran: true as const,
        result: await fn(),
      }),
    };

    const runner = new PipelinePushRunner(
      store as never,
      loaderOf(current()),
      noopExecutor,
      recorder,
    );
    const outcome = await runner.runPush(push());

    expect(outcome.ran).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].projectId).toBe(7);
    expect(calls[0].error).toBeNull();
  });
});

describe('PgPipelineSyncStore.recordSyncOutcome (#193)', () => {
  it('writes both columns the predicate reads', async () => {
    const { db, calls } = fakeDb();

    await new PgPipelineSyncStore(db).recordSyncOutcome(
      7,
      NOW_ISO,
      'sync_taxonomy: pooler gone',
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].text).toContain('last_synced_at');
    expect(calls[0].text).toContain('last_sync_error');
    expect(calls[0].params).toEqual([NOW_ISO, 'sync_taxonomy: pooler gone', 7]);
  });

  it('writes a null error, so a fixed project stops being reported', async () => {
    // Omitting the column on success would leave the old error standing forever — the project
    // would still be reported as failing long after the failure was fixed.
    const { db, calls } = fakeDb();

    await new PgPipelineSyncStore(db).recordSyncOutcome(7, NOW_ISO, null);

    expect(calls[0].params).toEqual([NOW_ISO, null, 7]);
  });
});
