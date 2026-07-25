import { describe, it, expect } from 'bun:test';
import { createHmac } from 'node:crypto';
import {
  GithubWebhookService,
  type DeliveryDedup,
  type OwnerRefresher,
  type PushPipelineRunner,
} from '../src/github/github-webhook.service';
import type { SyncEvent } from '../src/github/project-automation-sync';

const SECRET = 'wh-secret';
const sign = (b: string) =>
  'sha256=' + createHmac('sha256', SECRET).update(b).digest('hex');

function deps(over: Partial<{ seen: boolean }> = {}) {
  const refreshed: string[] = [];
  const pipelines: SyncEvent[] = [];
  const dedup: DeliveryDedup = { seenBefore: async () => over.seen ?? false };
  const refresher: OwnerRefresher = {
    refreshOwner: async (o) => {
      refreshed.push(o);
    },
  };
  const pipeline: PushPipelineRunner = {
    runPush: async (e) => {
      pipelines.push(e);
    },
  };
  return { dedup, refresher, refreshed, pipeline, pipelines };
}

describe('GithubWebhookService.handle (+ pipeline #192)', () => {
  it('refreshes owner and runs pipeline on default-branch push', async () => {
    const { dedup, refresher, refreshed, pipeline, pipelines } = deps();
    const svc = new GithubWebhookService(SECRET, dedup, refresher, pipeline);
    const body = JSON.stringify({
      after: 'abc123',
      ref: 'refs/heads/master',
      repository: {
        name: 'Demo',
        default_branch: 'master',
        owner: { login: 'Slow-Inc' },
      },
    });
    const r = await svc.handle(body, sign(body), 'd1');
    expect(r.code).toBe(202);
    expect(refreshed).toEqual(['Slow-Inc']);
    expect(pipelines).toEqual([
      {
        kind: 'github_push',
        owner: 'Slow-Inc',
        repo: 'Demo',
        headSha: 'abc123',
        isDefaultBranch: true,
      },
    ]);
    expect(r.action).toBe('pipeline:Slow-Inc/Demo');
  });

  it('marks non-default branch pushes with isDefaultBranch:false', async () => {
    const { dedup, refresher, pipeline, pipelines } = deps();
    const svc = new GithubWebhookService(SECRET, dedup, refresher, pipeline);
    const body = JSON.stringify({
      after: 'feat1',
      ref: 'refs/heads/feature',
      repository: {
        name: 'Demo',
        default_branch: 'master',
        owner: { login: 'Slow-Inc' },
      },
    });
    await svc.handle(body, sign(body), 'd2');
    expect(pipelines[0]?.isDefaultBranch).toBe(false);
  });

  it('still refreshes without pipeline when runner omitted', async () => {
    const { dedup, refresher, refreshed } = deps();
    const svc = new GithubWebhookService(SECRET, dedup, refresher);
    const body = JSON.stringify({
      repository: { name: 'x', owner: { login: 'Slow-Inc' } },
    });
    const r = await svc.handle(body, sign(body), 'd3');
    expect(r.code).toBe(202);
    expect(r.action).toBe('refreshed:Slow-Inc');
    expect(refreshed).toEqual(['Slow-Inc']);
  });

  it('rejects invalid signature', async () => {
    const { dedup, refresher, pipeline, pipelines } = deps();
    const svc = new GithubWebhookService(SECRET, dedup, refresher, pipeline);
    const body = '{}';
    const r = await svc.handle(body, 'sha256=bad', 'd4');
    expect(r.code).toBe(401);
    expect(pipelines).toEqual([]);
  });
});
