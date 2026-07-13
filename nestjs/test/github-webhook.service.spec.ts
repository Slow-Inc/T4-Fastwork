import { describe, it, expect } from 'bun:test';
import { createHmac } from 'node:crypto';
import {
  GithubWebhookService,
  type DeliveryDedup,
  type OwnerRefresher,
} from '../src/github/github-webhook.service';

const SECRET = 'wh-secret';
const sign = (b: string) =>
  'sha256=' + createHmac('sha256', SECRET).update(b).digest('hex');

function deps(over: Partial<{ seen: boolean }> = {}) {
  const refreshed: string[] = [];
  const dedup: DeliveryDedup = { seenBefore: async () => over.seen ?? false };
  const refresher: OwnerRefresher = {
    refreshOwner: async (o) => {
      refreshed.push(o);
    },
  };
  return { dedup, refresher, refreshed };
}

const body = JSON.stringify({
  action: 'pushed',
  repository: { name: 'x', owner: { login: 'Slow-Inc' } },
});

describe('GithubWebhookService.handle', () => {
  it('verifies, dedups, and refreshes the repo owner on a valid delivery', async () => {
    const { dedup, refresher, refreshed } = deps();
    const svc = new GithubWebhookService(SECRET, dedup, refresher);

    const r = await svc.handle(body, sign(body), 'delivery-1');

    expect(r.code).toBe(202);
    expect(refreshed).toEqual(['Slow-Inc']);
  });

  it('fails closed (503) when no webhook secret is configured', async () => {
    const { dedup, refresher, refreshed } = deps();
    const svc = new GithubWebhookService('', dedup, refresher);

    const r = await svc.handle(body, sign(body), 'delivery-x');

    expect(r.code).toBe(503);
    expect(refreshed).toEqual([]);
  });

  it('rejects an invalid signature with 401 and never refreshes', async () => {
    const { dedup, refresher, refreshed } = deps();
    const svc = new GithubWebhookService(SECRET, dedup, refresher);

    const r = await svc.handle(body, 'sha256=bad', 'delivery-2');

    expect(r.code).toBe(401);
    expect(refreshed).toEqual([]);
  });

  it('skips a duplicate delivery (200) without refreshing', async () => {
    const { dedup, refresher, refreshed } = deps({ seen: true });
    const svc = new GithubWebhookService(SECRET, dedup, refresher);

    const r = await svc.handle(body, sign(body), 'delivery-1');

    expect(r.code).toBe(200);
    expect(r.action).toBe('duplicate');
    expect(refreshed).toEqual([]);
  });

  it('rejects a missing delivery id with 400', async () => {
    const { dedup, refresher } = deps();
    const svc = new GithubWebhookService(SECRET, dedup, refresher);

    const r = await svc.handle(body, sign(body), null);

    expect(r.code).toBe(400);
  });

  it('accepts (200) but does not refresh when the payload has no repository owner', async () => {
    const { dedup, refresher, refreshed } = deps();
    const svc = new GithubWebhookService(SECRET, dedup, refresher);
    const ping = JSON.stringify({ zen: 'hi' });

    const r = await svc.handle(ping, sign(ping), 'delivery-3');

    expect(r.code).toBe(200);
    expect(refreshed).toEqual([]);
  });
});
