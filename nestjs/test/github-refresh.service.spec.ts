import { describe, it, expect } from 'bun:test';
import {
  GithubRefreshService,
  type ResourceSyncer,
} from '../src/github/github-refresh.service';

function recordingSyncer(
  changedKeys: string[] = [],
): ResourceSyncer & { calls: { key: string; url: string }[] } {
  const calls: { key: string; url: string }[] = [];
  return {
    calls,
    syncResource: async (key, url) => {
      calls.push({ key, url });
      return { changed: changedKeys.includes(key), data: [] };
    },
  };
}

describe('GithubRefreshService.refreshAll', () => {
  it('syncs the org repo list first, then each member repo list', async () => {
    const syncer = recordingSyncer(['repos:xenodeve']);
    const svc = new GithubRefreshService(syncer, ['xenodeve', 'Slowgers'], 'Slow-Inc');

    const r = await svc.refreshAll();

    expect(r.synced).toEqual([
      'org:Slow-Inc',
      'repos:xenodeve',
      'repos:Slowgers',
    ]);
    expect(syncer.calls[0].url).toContain('/orgs/Slow-Inc/repos');
    expect(syncer.calls[1].url).toContain('/users/xenodeve/repos');
    expect(syncer.calls[2].url).toContain('/users/Slowgers/repos');
  });

  it('reports only the resources that actually changed', async () => {
    const syncer = recordingSyncer(['org:Slow-Inc', 'repos:Slowgers']);
    const svc = new GithubRefreshService(syncer, ['xenodeve', 'Slowgers'], 'Slow-Inc');

    const r = await svc.refreshAll();

    expect(r.changed).toEqual(['org:Slow-Inc', 'repos:Slowgers']);
  });

  it('keeps going if one member fails, and records the failure', async () => {
    const syncer: ResourceSyncer = {
      syncResource: async (key) => {
        if (key === 'repos:boom') throw new Error('403');
        return { changed: false, data: [] };
      },
    };
    const svc = new GithubRefreshService(syncer, ['boom', 'ok'], 'Slow-Inc');

    const r = await svc.refreshAll();

    expect(r.synced).toContain('repos:ok');
    expect(r.failed).toEqual(['repos:boom']);
  });
});
