import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PipelineSyncController } from '../src/github/pipeline-sync.controller';
import type {
  PipelineActionExecutor,
  PipelineStateLoader,
} from '../src/github/pipeline-sync';
import type {
  ProjectSyncState,
  SyncActionKind,
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
    snapshotImage: null,
    readmeSha: 'same',
    snapshotReadmeSha: 'same',
    content: 'x',
    contentOwner: 'auto',
    categoryId: 1,
    categoryOwner: 'auto',
    tagsOwner: 'auto',
    technologiesOwner: 'auto',
    overviewSummary: 'x',
    overviewOwner: 'auto',
    lastCaptureTrigger: null,
    lastCaptureDispatchAt: null,
    ...over,
  };
}

function makeController(
  over: {
    exclusiveRan?: boolean;
    load?: ProjectSyncState | null;
  } = {},
) {
  const calls: SyncActionKind[] = [];
  const exclusiveNames: string[] = [];
  const store = {
    runExclusive: async (name: string, fn: () => Promise<unknown>) => {
      exclusiveNames.push(name);
      if (over.exclusiveRan === false) return { ran: false as const };
      return { ran: true as const, result: await fn() };
    },
  };
  const loader: PipelineStateLoader = {
    loadByGithub: async () => (over.load === undefined ? state() : over.load),
  };
  const track = (a: SyncActionKind) => async () => {
    calls.push(a);
  };
  const executor: PipelineActionExecutor = {
    syncLiveUrl: track('sync_live_url'),
    syncTaxonomy: track('sync_taxonomy'),
    syncOverview: track('sync_overview'),
    regenCaseStudy: track('regen_case_study'),
    autoPublish: track('auto_publish'),
    recaptureCover: track('recapture_cover'),
    rank: track('rank'),
    revalidate: track('revalidate'),
  };
  const c = new PipelineSyncController(store as never, loader, executor);
  return { c, calls, exclusiveNames };
}

describe('PipelineSyncController (#187)', () => {
  const prev = process.env.GITHUB_REFRESH_SECRET;
  beforeEach(() => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.GITHUB_REFRESH_SECRET;
    else process.env.GITHUB_REFRESH_SECRET = prev;
  });

  it('rejects wrong secret', async () => {
    const { c } = makeController();
    await expect(
      c.run('wrong', { owner: 'Slow-Inc', repo: 'Demo' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects invalid owner/repo', async () => {
    const { c } = makeController();
    await expect(
      c.run('right', { owner: '../x', repo: 'Demo' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('dry-run plans without executing', async () => {
    const { c, calls, exclusiveNames } = makeController();
    const res = (await c.run('right', {
      owner: 'Slow-Inc',
      repo: 'Demo',
    })) as { applied: boolean; executed: string[]; plan: { action: string }[] };
    expect(res.applied).toBe(false);
    expect(res.executed).toEqual([]);
    expect(res.plan.map((p) => p.action)).toContain('sync_live_url');
    expect(calls).toEqual([]);
    expect(exclusiveNames[0]).toContain('github-pipeline:');
  });

  it('apply:true executes planned actions under lock', async () => {
    const { c, calls } = makeController();
    const res = (await c.run('right', {
      owner: 'Slow-Inc',
      repo: 'Demo',
      apply: true,
    })) as { applied: boolean; executed: string[] };
    expect(res.applied).toBe(true);
    expect(res.executed).toContain('sync_live_url');
    expect(res.executed).toContain('recapture_cover');
    expect(calls).toEqual(res.executed);
  });

  it('returns skipped when lock held', async () => {
    const { c, calls } = makeController({ exclusiveRan: false });
    const res = (await c.run('right', {
      owner: 'Slow-Inc',
      repo: 'Demo',
      apply: true,
    })) as { skipped?: boolean };
    expect(res.skipped).toBe(true);
    expect(calls).toEqual([]);
  });
});
