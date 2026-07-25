/**
 * Nothing the pipeline is asked to do may vanish without a trace (#200).
 *
 * Three separate paths used to lose a real event with no log line at all: a push that lost the
 * advisory lock, every action ordered after one that threw (including `revalidate`, which is
 * last), and a Vercel delivery marked as seen before the work was attempted.
 */
import { describe, it, expect } from 'bun:test';
import {
  runPipelineSync,
  type PipelineActionExecutor,
  type PipelineStateLoader,
} from '../src/github/pipeline-sync';
import { PipelinePushRunner } from '../src/github/pipeline-push-runner';
import type {
  ProjectSyncState,
  SyncActionKind,
  SyncEvent,
} from '../src/github/project-automation-sync';

const STATE: ProjectSyncState = {
  id: 21,
  slug: 'dropped',
  status: 'draft',
  source: 'github',
  isPublicRepo: true,
  ghOwner: 'Slow-Inc',
  ghRepo: 'dropped',
  liveUrl: null,
  snapshotImage: null,
  readmeSha: 'sha-b',
  snapshotReadmeSha: 'sha-a',
  content: null,
  contentOwner: 'auto',
  categoryId: null,
  categoryOwner: 'auto',
  tagsOwner: 'auto',
  technologiesOwner: 'auto',
  overviewSummary: null,
  overviewOwner: 'auto',
  lastCaptureTrigger: null,
  lastCaptureDispatchAt: null,
};

const PUSH: SyncEvent = {
  kind: 'github_push',
  owner: 'Slow-Inc',
  repo: 'dropped',
  headSha: 'sha-b',
  isDefaultBranch: true,
};

const loader: PipelineStateLoader = {
  loadByGithub: () => Promise.resolve(STATE),
};

/** Records calls; `failOn` throws for those action kinds. */
function executorFailing(failOn: SyncActionKind[]): {
  executor: PipelineActionExecutor;
  calls: SyncActionKind[];
} {
  const calls: SyncActionKind[] = [];
  const track = (kind: SyncActionKind) => () => {
    calls.push(kind);
    if (failOn.includes(kind)) {
      return Promise.reject(new Error(`${kind} exploded`));
    }
    return Promise.resolve();
  };
  return {
    calls,
    executor: {
      syncLiveUrl: track('sync_live_url'),
      syncTaxonomy: track('sync_taxonomy'),
      syncOverview: track('sync_overview'),
      regenCaseStudy: track('regen_case_study'),
      autoPublish: track('auto_publish'),
      recaptureCover: track('recapture_cover'),
      rank: track('rank'),
      revalidate: track('revalidate'),
    },
  };
}

describe('one failing action does not cancel the rest (#200)', () => {
  it('keeps going after a throw and still revalidates last', async () => {
    const { executor, calls } = executorFailing(['sync_taxonomy']);

    const res = await runPipelineSync(
      PUSH,
      { apply: true },
      loader,
      executor,
    );

    // The failure is reported, not swallowed and not fatal.
    expect(res.failed.map((f) => f.action)).toEqual(['sync_taxonomy']);
    expect(res.failed[0]?.error).toContain('sync_taxonomy exploded');

    // Everything planned after it still ran, with revalidate last.
    expect(calls).toContain('sync_overview');
    expect(calls).toContain('auto_publish');
    expect(calls).toContain('recapture_cover');
    expect(calls[calls.length - 1]).toBe('revalidate');

    // A failed action is not claimed as executed.
    expect(res.executed).not.toContain('sync_taxonomy');
    expect(res.executed).toContain('revalidate');
  });

  it('reports every failure when several actions throw', async () => {
    const { executor } = executorFailing(['sync_overview', 'recapture_cover']);

    const res = await runPipelineSync(PUSH, { apply: true }, loader, executor);

    expect(res.failed.map((f) => f.action).sort()).toEqual([
      'recapture_cover',
      'sync_overview',
    ]);
    expect(res.executed).toContain('revalidate');
  });
});

describe('losing the advisory lock is reported, not silence (#200)', () => {
  it('runPush returns a skipped outcome when another run holds the lock', async () => {
    const { executor, calls } = executorFailing([]);
    const store = { runExclusive: () => Promise.resolve({ ran: false as const }) };

    const runner = new PipelinePushRunner(
      store as never,
      loader,
      executor,
    );
    const outcome = await runner.runPush(PUSH);

    expect(outcome.ran).toBe(false);
    expect(outcome.reason).toBe('lock-held');
    expect(calls).toEqual([]);
  });

  it('runPush reports the failure instead of swallowing it', async () => {
    const { executor } = executorFailing([]);
    const store = {
      runExclusive: () => Promise.reject(new Error('pooler gone')),
    };

    const runner = new PipelinePushRunner(store as never, loader, executor);
    const outcome = await runner.runPush(PUSH);

    expect(outcome.ran).toBe(false);
    expect(outcome.reason).toContain('pooler gone');
  });

  it('runPush reports a completed run', async () => {
    const { executor } = executorFailing([]);
    const store = {
      runExclusive: async <T>(_l: string, fn: () => Promise<T>) => ({
        ran: true as const,
        result: await fn(),
      }),
    };

    const runner = new PipelinePushRunner(store as never, loader, executor);
    const outcome = await runner.runPush(PUSH);

    expect(outcome.ran).toBe(true);
  });
});
