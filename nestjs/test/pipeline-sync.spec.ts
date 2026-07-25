import { describe, it, expect } from 'bun:test';
import {
  runPipelineSync,
  type PipelineActionExecutor,
  type PipelineStateLoader,
} from '../src/github/pipeline-sync';
import type {
  ProjectSyncState,
  SyncActionKind,
  SyncEvent,
} from '../src/github/project-automation-sync';

function state(over: Partial<ProjectSyncState> = {}): ProjectSyncState {
  return {
    id: 1,
    slug: 'demo',
    status: 'published',
    source: 'github',
    isPublicRepo: true,
    ghOwner: 'Slow-Inc',
    ghRepo: 'Demo',
    liveUrl: null,
    snapshotImage: 'https://cdn.example/cover.png',
    readmeSha: 'same',
    snapshotReadmeSha: 'same',
    content: 'filled',
    contentOwner: 'auto',
    categoryId: null,
    categoryOwner: 'auto',
    tagsOwner: 'auto',
    technologiesOwner: 'auto',
    overviewSummary: null,
    overviewOwner: 'auto',
    lastCaptureTrigger: 'push:old',
    lastCaptureDispatchAt: '2026-01-01T00:00:00.000Z',
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

function recordingExecutor(): {
  executor: PipelineActionExecutor;
  calls: SyncActionKind[];
} {
  const calls: SyncActionKind[] = [];
  const track = (action: SyncActionKind) => async () => {
    calls.push(action);
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

describe('runPipelineSync', () => {
  it('dry-run returns plan without calling executors', async () => {
    const { executor, calls } = recordingExecutor();
    const loader: PipelineStateLoader = {
      loadByGithub: async () => state(),
    };
    const res = await runPipelineSync(
      push(),
      {
        apply: false,
        now: Date.parse('2026-01-01T01:00:00.000Z'),
        deferred: new Set<SyncActionKind>([
          'regen_case_study',
          'recapture_cover',
          'auto_publish',
        ]),
      },
      loader,
      executor,
    );
    expect(res.found).toBe(true);
    expect(res.applied).toBe(false);
    expect(res.executed).toEqual([]);
    expect(calls).toEqual([]);
    expect(res.plan.map((p) => p.action)).toContain('sync_live_url');
    expect(res.plan.map((p) => p.action)).toContain('sync_taxonomy');
    expect(res.deferred).toContain('recapture_cover');
  });

  it('apply executes cheap actions and lists deferred ones', async () => {
    const { executor, calls } = recordingExecutor();
    const loader: PipelineStateLoader = {
      loadByGithub: async () => state(),
    };
    const deferred = new Set<SyncActionKind>([
      'regen_case_study',
      'recapture_cover',
      'auto_publish',
    ]);
    const res = await runPipelineSync(
      push(),
      { apply: true, now: Date.parse('2026-01-01T01:00:00.000Z'), deferred },
      loader,
      executor,
    );
    expect(res.executed).toContain('sync_live_url');
    expect(res.executed).toContain('sync_taxonomy');
    expect(res.executed).toContain('sync_overview');
    expect(res.executed).toContain('rank');
    expect(res.executed).toContain('revalidate');
    expect(res.executed).not.toContain('recapture_cover');
    expect(res.deferred).toContain('recapture_cover');
    expect(calls).toEqual(res.executed);
  });

  it('returns found:false when project is missing', async () => {
    const { executor, calls } = recordingExecutor();
    const loader: PipelineStateLoader = {
      loadByGithub: async () => null,
    };
    const res = await runPipelineSync(
      push(),
      { apply: true },
      loader,
      executor,
    );
    expect(res.found).toBe(false);
    expect(res.plan).toEqual([]);
    expect(calls).toEqual([]);
  });
});
