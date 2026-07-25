/**
 * A webhook must not run LLM work inline (#199).
 *
 * The push and Vercel handlers answer inside a Vercel function capped at maxDuration 60
 * (`nestjs/vercel.json`), and one event can plan three LLM actions at once (taxonomy +
 * overview + case study). The rest of the backend already caps LLM work at one per run for
 * exactly this reason — the drain endpoints `/github/generate-{taxonomy,overviews,case-studies}`
 * each default `maxPerRun = 1`. So the webhook defers those three and the cron drains them; the
 * project row itself is the queue, because every LLM gate is state-derived ("empty AND owner=auto").
 */
import { describe, it, expect } from 'bun:test';
import {
  runPipelineSync,
  WEBHOOK_DEFERRED_ACTIONS,
  type PipelineActionExecutor,
  type PipelineStateLoader,
} from '../src/github/pipeline-sync';
import { PipelinePushRunner } from '../src/github/pipeline-push-runner';
import type {
  ProjectSyncState,
  SyncActionKind,
  SyncEvent,
} from '../src/github/project-automation-sync';

/** Everything auto-owned and empty, so the planner asks for every action it can. */
const NEEDS_EVERYTHING: ProjectSyncState = {
  id: 11,
  slug: 'fresh',
  status: 'draft',
  source: 'github',
  isPublicRepo: true,
  ghOwner: 'Slow-Inc',
  ghRepo: 'fresh',
  liveUrl: null,
  snapshotImage: null,
  readmeSha: 'sha-new',
  snapshotReadmeSha: 'sha-old',
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
  repo: 'fresh',
  headSha: 'sha-new',
  isDefaultBranch: true,
};

function loader(state: ProjectSyncState | null): PipelineStateLoader {
  return { loadByGithub: () => Promise.resolve(state) };
}

function recordingExecutor(): {
  executor: PipelineActionExecutor;
  calls: SyncActionKind[];
} {
  const calls: SyncActionKind[] = [];
  const track = (kind: SyncActionKind) => () => {
    calls.push(kind);
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

const LLM_KINDS: SyncActionKind[] = [
  'sync_taxonomy',
  'sync_overview',
  'regen_case_study',
];

describe('webhook path defers LLM actions (#199)', () => {
  it('names exactly the three LLM actions as the webhook-deferred set', () => {
    expect([...WEBHOOK_DEFERRED_ACTIONS].sort()).toEqual([...LLM_KINDS].sort());
  });

  it('executes the cheap actions and defers every LLM action', async () => {
    const { executor, calls } = recordingExecutor();

    const res = await runPipelineSync(
      PUSH,
      { apply: true, deferred: WEBHOOK_DEFERRED_ACTIONS },
      loader(NEEDS_EVERYTHING),
      executor,
    );

    // The planner still wants the LLM work — it is deferred, not gated away.
    for (const kind of LLM_KINDS) {
      expect(res.plan.map((p) => p.action)).toContain(kind);
      expect(res.deferred).toContain(kind);
      expect(res.executed).not.toContain(kind);
      expect(calls).not.toContain(kind);
    }

    // The cheap ones still run on the request path.
    expect(calls).toEqual([
      'sync_live_url',
      'auto_publish',
      'recapture_cover',
      'rank',
      'revalidate',
    ]);
  });

  it('the cron path defers nothing, so the drain endpoints can do the LLM work', async () => {
    const { executor, calls } = recordingExecutor();

    const res = await runPipelineSync(
      { ...PUSH, kind: 'manual' },
      { apply: true },
      loader(NEEDS_EVERYTHING),
      executor,
    );

    expect(res.deferred).toEqual([]);
    for (const kind of LLM_KINDS) expect(calls).toContain(kind);
  });
});

describe('the push runner is the caller that must defer (#199)', () => {
  it('runPush never invokes an LLM action', async () => {
    const { executor, calls } = recordingExecutor();
    // Lock is granted; the point of this test is what runs inside it, not the lock itself.
    const store = {
      runExclusive: async <T>(_lock: string, fn: () => Promise<T>) => ({
        ran: true as const,
        result: await fn(),
      }),
    };
    const runner = new PipelinePushRunner(
      store as never,
      loader(NEEDS_EVERYTHING),
      executor,
    );

    await runner.runPush(PUSH);

    for (const kind of LLM_KINDS) expect(calls).not.toContain(kind);
    expect(calls).toContain('recapture_cover');
    expect(calls).toContain('revalidate');
  });
});
