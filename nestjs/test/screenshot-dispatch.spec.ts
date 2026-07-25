import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { dispatchScreenshotWorkflow } from '../src/github/screenshot-dispatch';

describe('dispatchScreenshotWorkflow (#190)', () => {
  const prevToken = process.env.SCREENSHOT_DISPATCH_TOKEN;
  const prevRepo = process.env.SCREENSHOT_WORKFLOW_REPO;

  beforeEach(() => {
    process.env.SCREENSHOT_DISPATCH_TOKEN = 'tok';
    process.env.SCREENSHOT_WORKFLOW_REPO = 'Slow-Inc/T4-Fastwork';
  });
  afterEach(() => {
    if (prevToken === undefined) delete process.env.SCREENSHOT_DISPATCH_TOKEN;
    else process.env.SCREENSHOT_DISPATCH_TOKEN = prevToken;
    if (prevRepo === undefined) delete process.env.SCREENSHOT_WORKFLOW_REPO;
    else process.env.SCREENSHOT_WORKFLOW_REPO = prevRepo;
  });

  it('no-ops without a token', async () => {
    delete process.env.SCREENSHOT_DISPATCH_TOKEN;
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    const r = await dispatchScreenshotWorkflow({ slug: 'demo' });
    expect(r).toEqual({ dispatched: false, reason: 'no-token' });
  });

  it('POSTs workflow_dispatch with slug/force/trigger inputs', async () => {
    const bodies: string[] = [];
    const fetchImpl = async (_url: string, init?: RequestInit) => {
      bodies.push(String(init?.body ?? ''));
      return new Response(null, { status: 204 });
    };

    const r = await dispatchScreenshotWorkflow({
      slug: 'demo',
      force: true,
      trigger: 'push:abc',
      fetchImpl,
    });
    expect(r.dispatched).toBe(true);
    const parsed = JSON.parse(bodies[0]) as {
      inputs: { slug: string; force: string; trigger: string };
    };
    expect(parsed.inputs).toEqual({
      slug: 'demo',
      force: 'true',
      trigger: 'push:abc',
    });
  });
});

describe('dispatch cannot hang the transaction it runs inside (#199)', () => {
  it('passes an abort signal so a stalled GitHub socket cannot hold the pooler open', async () => {
    const prev = process.env.SCREENSHOT_DISPATCH_TOKEN;
    process.env.SCREENSHOT_DISPATCH_TOKEN = 'test-token';
    let init: RequestInit | undefined;
    try {
      await dispatchScreenshotWorkflow({
        slug: 'alpha',
        trigger: 'push:abc',
        fetchImpl: ((_url: string, i: RequestInit) => {
          init = i;
          return Promise.resolve(new Response('', { status: 204 }));
        }) as unknown as typeof fetch,
      });
    } finally {
      if (prev === undefined) delete process.env.SCREENSHOT_DISPATCH_TOKEN;
      else process.env.SCREENSHOT_DISPATCH_TOKEN = prev;
    }

    expect(init?.signal).toBeDefined();
  });
});
