import { describe, it, expect } from 'bun:test';
import {
  GithubRefreshService,
  SnapshotOwnerRefresher,
  type ResourceSyncer,
  type DetailSyncer,
} from '../src/github/github-refresh.service';

function recordingDetail(): DetailSyncer & {
  profiles: string[];
  repos: string[];
} {
  const profiles: string[] = [];
  const repos: string[] = [];
  return {
    profiles,
    repos,
    syncUserProfile: async (login) => {
      profiles.push(login);
    },
    syncRepoDetail: async (owner, repo) => {
      repos.push(`${owner}/${repo}`);
      return { readmeSha: null };
    },
  };
}

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
    const svc = new GithubRefreshService(
      syncer,
      ['xenodeve', 'Slowgers'],
      'Slow-Inc',
    );

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

  it('also syncs member profiles + showcase repo detail when a DetailSyncer is given (P6/P7)', async () => {
    const syncer = recordingSyncer();
    const detail = recordingDetail();
    const svc = new GithubRefreshService(
      syncer,
      ['xenodeve', 'Slowgers'],
      'Slow-Inc',
      detail,
      [{ owner: 'Slow-Inc', repo: 'MangaDock' }],
    );

    const r = await svc.refreshAll();

    expect(detail.profiles).toEqual(['xenodeve', 'Slowgers']);
    expect(detail.repos).toEqual(['Slow-Inc/MangaDock']);
    // profile + repo-detail keys are recorded in the summary
    expect(r.synced).toContain('user:xenodeve');
    expect(r.synced).toContain('repo:Slow-Inc/MangaDock:contributors');
  });

  it('records a profile/detail failure without aborting the batch', async () => {
    const syncer = recordingSyncer();
    const detail: DetailSyncer = {
      syncUserProfile: async (login) => {
        if (login === 'xenodeve') throw new Error('boom');
      },
      syncRepoDetail: async () => ({ readmeSha: null }),
    };
    const svc = new GithubRefreshService(
      syncer,
      ['xenodeve', 'Slowgers'],
      'Slow-Inc',
      detail,
      [],
    );

    const r = await svc.refreshAll();

    expect(r.failed).toContain('user:xenodeve');
    expect(r.synced).toContain('user:Slowgers'); // batch continued
  });

  it('reports only the resources that actually changed', async () => {
    const syncer = recordingSyncer(['org:Slow-Inc', 'repos:Slowgers']);
    const svc = new GithubRefreshService(
      syncer,
      ['xenodeve', 'Slowgers'],
      'Slow-Inc',
    );

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

describe('SnapshotOwnerRefresher.refreshOwner', () => {
  it('syncs the org repo list when the owner is the org', async () => {
    const calls: { key: string; url: string }[] = [];
    const syncer: ResourceSyncer = {
      syncResource: async (key, url) => {
        calls.push({ key, url });
        return { changed: true, data: [] };
      },
    };
    await new SnapshotOwnerRefresher(syncer, 'Slow-Inc').refreshOwner(
      'Slow-Inc',
    );
    expect(calls[0].key).toBe('org:Slow-Inc');
    expect(calls[0].url).toContain('/orgs/Slow-Inc/repos');
  });

  it('syncs a member repo list when the owner is a user', async () => {
    const calls: { key: string; url: string }[] = [];
    const syncer: ResourceSyncer = {
      syncResource: async (key, url) => {
        calls.push({ key, url });
        return { changed: true, data: [] };
      },
    };
    await new SnapshotOwnerRefresher(syncer, 'Slow-Inc').refreshOwner(
      'xenodeve',
    );
    expect(calls[0].key).toBe('repos:xenodeve');
    expect(calls[0].url).toContain('/users/xenodeve/repos');
  });
});
