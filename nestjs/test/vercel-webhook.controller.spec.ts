import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createHmac } from 'node:crypto';
import {
  parseVercelDeployEvent,
  verifyVercelSignature,
  VercelWebhookController,
} from '../src/github/vercel-webhook.controller';
import type {
  PipelineActionExecutor,
  PipelineStateLoader,
} from '../src/github/pipeline-sync';
import type { ProjectSyncState } from '../src/github/project-automation-sync';

const SECRET = 'vercel-secret';
const sign = (b: string) => createHmac('sha1', SECRET).update(b).digest('hex');

function state(): ProjectSyncState {
  return {
    id: 1,
    slug: 'demo',
    status: 'published',
    source: 'github',
    isPublicRepo: true,
    ghOwner: 'Slow-Inc',
    ghRepo: 'Demo',
    liveUrl: 'https://demo.example',
    snapshotImage: 'https://cdn/x.png',
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
    lastCaptureTrigger: 'deploy:old',
    lastCaptureDispatchAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('verifyVercelSignature / parseVercelDeployEvent', () => {
  it('accepts a valid sha1 HMAC', () => {
    const body = '{"type":"deployment.succeeded"}';
    expect(verifyVercelSignature(body, sign(body), SECRET)).toBe(true);
    expect(verifyVercelSignature(body, 'bad', SECRET)).toBe(false);
  });

  it('parses production success payloads', () => {
    const raw = JSON.stringify({
      type: 'deployment.succeeded',
      payload: {
        target: 'production',
        deployment: {
          id: 'dpl_1',
          url: 'demo.example',
          name: 'demo',
        },
      },
    });
    expect(parseVercelDeployEvent(raw)).toEqual({
      deploymentId: 'dpl_1',
      target: 'production',
      url: 'demo.example',
      name: 'demo',
    });
  });
});

describe('VercelWebhookController (#191)', () => {
  const prev = process.env.VERCEL_WEBHOOK_SECRET;
  beforeEach(() => {
    process.env.VERCEL_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.VERCEL_WEBHOOK_SECRET;
    else process.env.VERCEL_WEBHOOK_SECRET = prev;
  });

  function make() {
    const seen: string[] = [];
    const exclusive: string[] = [];
    const store = {
      seenBefore: async (id: string) => {
        if (seen.includes(id)) return true;
        seen.push(id);
        return false;
      },
      runExclusive: async (name: string, fn: () => Promise<unknown>) => {
        exclusive.push(name);
        return { ran: true as const, result: await fn() };
      },
    };
    const loader: PipelineStateLoader = {
      loadByGithub: async () => state(),
    };
    const calls: string[] = [];
    const executor: PipelineActionExecutor = {
      syncLiveUrl: async () => {},
      syncTaxonomy: async () => {},
      syncOverview: async () => {},
      regenCaseStudy: async () => {},
      autoPublish: async () => {},
      recaptureCover: async () => {
        calls.push('recapture_cover');
      },
      rank: async () => {},
      revalidate: async () => {
        calls.push('revalidate');
      },
    };
    const mapper = {
      resolve: async () => ({ owner: 'Slow-Inc', repo: 'Demo' }),
    };
    const c = new VercelWebhookController(
      store as never,
      loader,
      executor,
      mapper,
    );
    return { c, calls, exclusive, seen };
  }

  function fakeReqRes(raw: string) {
    const statusCodes: number[] = [];
    const bodies: unknown[] = [];
    const req = { rawBody: Buffer.from(raw) } as never;
    const res = {
      status(code: number) {
        statusCodes.push(code);
        return this;
      },
      json(body: unknown) {
        bodies.push(body);
        return this;
      },
    } as never;
    return { req, res, statusCodes, bodies };
  }

  it('rejects invalid signature with 401', async () => {
    const { c } = make();
    const raw = '{}';
    const { req, res, statusCodes } = fakeReqRes(raw);
    await c.handle(req, res, 'bad');
    expect(statusCodes[0]).toBe(401);
  });

  it('ignores non-production deploys', async () => {
    const { c, calls } = make();
    const raw = JSON.stringify({
      type: 'deployment.succeeded',
      payload: {
        target: 'preview',
        deployment: { id: 'dpl_p', url: 'x', name: 'x' },
      },
    });
    const { req, res, statusCodes, bodies } = fakeReqRes(raw);
    await c.handle(req, res, sign(raw));
    expect(statusCodes[0]).toBe(200);
    expect(bodies[0]).toEqual({ action: 'ignored-non-production' });
    expect(calls).toEqual([]);
  });

  it('runs pipeline once for production success', async () => {
    const { c, calls, exclusive } = make();
    const raw = JSON.stringify({
      type: 'deployment.succeeded',
      payload: {
        target: 'production',
        deployment: { id: 'dpl_new', url: 'demo.example', name: 'demo' },
      },
    });
    const { req, res, statusCodes } = fakeReqRes(raw);
    await c.handle(req, res, sign(raw));
    expect(statusCodes[0]).toBe(202);
    expect(exclusive[0]).toContain('github-pipeline:');
    expect(calls).toContain('recapture_cover');
  });

  it('dedupes duplicate deployment ids', async () => {
    const { c, calls } = make();
    const raw = JSON.stringify({
      type: 'deployment.succeeded',
      payload: {
        target: 'production',
        deployment: { id: 'dpl_dup', url: 'demo.example', name: 'demo' },
      },
    });
    const a = fakeReqRes(raw);
    await c.handle(a.req, a.res, sign(raw));
    const b = fakeReqRes(raw);
    await c.handle(b.req, b.res, sign(raw));
    expect(b.statusCodes[0]).toBe(200);
    expect(b.bodies[0]).toEqual({ action: 'duplicate' });
    expect(calls.filter((x) => x === 'recapture_cover')).toHaveLength(1);
  });

  // #200 — the delivery used to be marked as seen BEFORE the work was attempted, so a throw
  // or a timeout lost that production deployment permanently: Vercel's redelivery was
  // deduplicated away. Dedupe now happens only after the pipeline resolves.
  function makeFailing() {
    const seen: string[] = [];
    const store = {
      seenBefore: async (id: string) => {
        if (seen.includes(id)) return true;
        seen.push(id);
        return false;
      },
      forget: async (id: string) => {
        const i = seen.indexOf(id);
        if (i >= 0) seen.splice(i, 1);
      },
      runExclusive: async () => {
        throw new Error('pipeline exploded');
      },
    };
    const c = new VercelWebhookController(
      store as never,
      { loadByGithub: async () => state() } as never,
      {} as never,
      { resolve: async () => ({ owner: 'Slow-Inc', repo: 'Demo' }) } as never,
    );
    return { c, seen };
  }

  const deployBody = (id: string) =>
    JSON.stringify({
      type: 'deployment.succeeded',
      payload: {
        deployment: { id, url: 'demo.example', name: 'demo' },
        target: 'production',
      },
    });

  it('a delivery whose pipeline throws is NOT recorded, so it stays retryable', async () => {
    const { c, seen } = makeFailing();
    const raw = deployBody('dpl_retry');
    const { req, res } = fakeReqRes(raw);

    await expect(c.handle(req, res, sign(raw))).rejects.toThrow(
      'pipeline exploded',
    );

    expect(seen).toEqual([]);
  });

  it('a delivery that succeeds is recorded after the fact and then deduped', async () => {
    const { c, seen } = make();
    const raw = deployBody('dpl_ok');

    const first = fakeReqRes(raw);
    await c.handle(first.req, first.res, sign(raw));
    expect(seen).toEqual(['vercel-deploy:dpl_ok']);
    expect(first.statusCodes[0]).toBe(202);

    const second = fakeReqRes(raw);
    await c.handle(second.req, second.res, sign(raw));
    expect(second.bodies[0]).toEqual({ action: 'duplicate' });
  });
});
