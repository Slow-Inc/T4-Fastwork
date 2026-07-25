/**
 * S8 / #193 — end-to-end orchestration smoke (fakes, no network).
 * Asserts push → plan → execute path and vercel deploy → recapture.
 */
import { describe, it, expect } from 'bun:test';
import { createHmac } from 'node:crypto';
import {
  GithubWebhookService,
  type DeliveryDedup,
  type OwnerRefresher,
  type PushPipelineRunner,
} from '../src/github/github-webhook.service';
import { runPipelineSync } from '../src/github/pipeline-sync';
import type {
  PipelineActionExecutor,
  PipelineStateLoader,
} from '../src/github/pipeline-sync';
import type {
  ProjectSyncState,
  SyncActionKind,
  SyncEvent,
} from '../src/github/project-automation-sync';

const SECRET = 'wh';
const sign = (b: string) =>
  'sha256=' + createHmac('sha256', SECRET).update(b).digest('hex');

function baseState(over: Partial<ProjectSyncState> = {}): ProjectSyncState {
  return {
    id: 7,
    slug: 'demo',
    status: 'draft',
    source: 'github',
    isPublicRepo: true,
    ghOwner: 'Slow-Inc',
    ghRepo: 'Demo',
    liveUrl: null,
    snapshotImage: 'https://cdn/old.png',
    readmeSha: 'old',
    snapshotReadmeSha: 'new',
    content: 'stale',
    contentOwner: 'auto',
    categoryId: null,
    categoryOwner: 'auto',
    tagsOwner: 'auto',
    technologiesOwner: 'auto',
    overviewSummary: null,
    overviewOwner: 'auto',
    lastCaptureTrigger: 'push:prev',
    lastCaptureDispatchAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('S8 pipeline orchestration smoke (#193)', () => {
  it('push webhook → pipeline executes content + cover + auto_publish', async () => {
    const executed: SyncActionKind[] = [];
    const loader: PipelineStateLoader = {
      loadByGithub: async () => baseState(),
    };
    const track = (a: SyncActionKind) => async () => {
      executed.push(a);
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

    const pipeline: PushPipelineRunner = {
      runPush: async (event: SyncEvent) => {
        await runPipelineSync(
          event,
          { apply: true, now: Date.parse('2026-01-01T01:00:00.000Z') },
          loader,
          executor,
        );
      },
    };

    const refreshed: string[] = [];
    const dedup: DeliveryDedup = { seenBefore: async () => false };
    const refresher: OwnerRefresher = {
      refreshOwner: async (o) => {
        refreshed.push(o);
      },
    };
    const svc = new GithubWebhookService(SECRET, dedup, refresher, pipeline);
    const body = JSON.stringify({
      after: 'deadbeef',
      ref: 'refs/heads/master',
      repository: {
        name: 'Demo',
        default_branch: 'master',
        owner: { login: 'Slow-Inc' },
      },
    });
    const r = await svc.handle(body, sign(body), 's8-1');
    expect(r.code).toBe(202);
    expect(refreshed).toEqual(['Slow-Inc']);
    expect(executed).toEqual([
      'sync_live_url',
      'sync_taxonomy',
      'sync_overview',
      'regen_case_study',
      'auto_publish',
      'recapture_cover',
      'rank',
      'revalidate',
    ]);
  });

  it('same capture trigger is idempotent (no second recapture)', async () => {
    const recaptures: number[] = [];
    const loader: PipelineStateLoader = {
      loadByGithub: async () =>
        baseState({
          status: 'published',
          liveUrl: 'https://demo.example',
          categoryId: 1,
          overviewSummary: 'ok',
          readmeSha: 'same',
          snapshotReadmeSha: 'same',
          lastCaptureTrigger: 'push:deadbeef',
          lastCaptureDispatchAt: '2026-01-01T00:00:00.000Z',
        }),
    };
    const executor: PipelineActionExecutor = {
      syncLiveUrl: async () => {},
      syncTaxonomy: async () => {},
      syncOverview: async () => {},
      regenCaseStudy: async () => {},
      autoPublish: async () => {},
      recaptureCover: async () => {
        recaptures.push(1);
      },
      rank: async () => {},
      revalidate: async () => {},
    };
    const res = await runPipelineSync(
      {
        kind: 'github_push',
        owner: 'Slow-Inc',
        repo: 'Demo',
        headSha: 'deadbeef',
        isDefaultBranch: true,
      },
      { apply: true, now: Date.parse('2026-01-01T01:00:00.000Z') },
      loader,
      executor,
    );
    expect(res.executed).not.toContain('recapture_cover');
    expect(recaptures).toEqual([]);
  });
});
