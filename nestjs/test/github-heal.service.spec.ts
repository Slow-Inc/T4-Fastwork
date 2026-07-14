import { describe, it, expect } from 'bun:test';
import {
  GithubHealService,
  type SingleFlight,
  type ResourceSyncer,
} from '../src/github/github-heal.service.ts';

function fakeSyncer(changed: boolean): ResourceSyncer & { calls: number } {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    syncResource: async () => {
      calls++;
      return { changed, data: {} };
    },
  };
}

/** A single-flight that grants the lock at most `grants` times (contention). */
function fakeFlight(grants = 1): SingleFlight {
  let remaining = grants;
  return {
    runExclusive: async (_name, fn) => {
      if (remaining > 0) {
        remaining--;
        return { ran: true, result: await fn() };
      }
      return { ran: false };
    },
  };
}

describe('GithubHealService.heal', () => {
  it('runs the sync and reports changed on a 200', async () => {
    const syncer = fakeSyncer(true);
    const svc = new GithubHealService(syncer, fakeFlight(1));

    const r = await svc.heal('user:xenodeve', 'https://api.github.com/x');

    expect(r).toEqual({ healing: false, changed: true });
    expect(syncer.calls).toBe(1);
  });

  it('reports changed:false when the resource was unchanged (304)', async () => {
    const svc = new GithubHealService(fakeSyncer(false), fakeFlight(1));
    expect(await svc.heal('k', 'u')).toEqual({ healing: false, changed: false });
  });

  it('single-flight: a losing concurrent heal skips the GitHub call', async () => {
    const syncer = fakeSyncer(true);
    const svc = new GithubHealService(syncer, fakeFlight(1)); // one grant only

    const [a, b] = await Promise.all([svc.heal('k', 'u'), svc.heal('k', 'u')]);

    expect(syncer.calls).toBe(1); // exactly one GitHub call
    const sorted = [a, b].sort((x, y) => Number(x.healing) - Number(y.healing));
    expect(sorted[0]).toEqual({ healing: false, changed: true });
    expect(sorted[1]).toEqual({ healing: true, changed: false });
  });

  it('propagates a sync error (the lock is released by runExclusive)', async () => {
    const throwing: ResourceSyncer = {
      syncResource: async () => {
        throw new Error('github 500');
      },
    };
    const svc = new GithubHealService(throwing, fakeFlight(1));
    await expect(svc.heal('k', 'u')).rejects.toThrow('github 500');
  });
});
