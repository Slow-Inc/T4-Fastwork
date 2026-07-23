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

  it('unions DB-derived showcase repos with the MangaDock constant, deduped (T2.4)', async () => {
    const syncer = recordingSyncer();
    const detail = recordingDetail();
    const provider = {
      listShowcaseRepos: async () => [
        { owner: 'Slow-Inc', repo: 'MangaDock' }, // dup of the constant → deduped
        { owner: 'xenodeve', repo: 'foo' },
        { owner: 'Slow-Inc', repo: 'bar' },
      ],
    };
    const svc = new GithubRefreshService(
      syncer,
      ['xenodeve'],
      'Slow-Inc',
      detail,
      [{ owner: 'Slow-Inc', repo: 'MangaDock' }],
      provider,
    );

    await svc.refreshAll();

    // constant first (MangaDock always included), then the fresh DB rows, once each
    expect(detail.repos).toEqual([
      'Slow-Inc/MangaDock',
      'xenodeve/foo',
      'Slow-Inc/bar',
    ]);
  });

  it('falls back to the constant showcase repos when the provider throws (serve-stale, T2.4)', async () => {
    const syncer = recordingSyncer();
    const detail = recordingDetail();
    const provider = {
      listShowcaseRepos: async () => {
        throw new Error('db down');
      },
    };
    const svc = new GithubRefreshService(
      syncer,
      ['xenodeve'],
      'Slow-Inc',
      detail,
      [{ owner: 'Slow-Inc', repo: 'MangaDock' }],
      provider,
    );

    await svc.refreshAll();

    expect(detail.repos).toEqual(['Slow-Inc/MangaDock']);
  });

  it('caps the showcase repo set at 50 to bound sequential GitHub calls (T2.4)', async () => {
    const syncer = recordingSyncer();
    const detail = recordingDetail();
    const many = Array.from({ length: 60 }, (_, i) => ({
      owner: 'Slow-Inc',
      repo: `r${i}`,
    }));
    const provider = { listShowcaseRepos: async () => many };
    const svc = new GithubRefreshService(
      syncer,
      [],
      'Slow-Inc',
      detail,
      [],
      provider,
    );

    await svc.refreshAll();

    expect(detail.repos.length).toBe(50);
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

describe('GithubRefreshService.refreshRepoDetail (#143)', () => {
  it('syncs only one repo detail and never touches org/member lists', async () => {
    const listCalls: string[] = [];
    const syncer: ResourceSyncer = {
      syncResource: async (key) => {
        listCalls.push(key);
        return { changed: false, data: [] };
      },
    };
    const repos: string[] = [];
    const detail: DetailSyncer = {
      syncUserProfile: async () => {
        throw new Error('must not sync profiles');
      },
      syncRepoDetail: async (owner, repo) => {
        repos.push(`${owner}/${repo}`);
        return { readmeSha: 'abc' };
      },
    };
    const svc = new GithubRefreshService(
      syncer,
      ['xenodeve'],
      'Slow-Inc',
      detail,
    );

    const r = await svc.refreshRepoDetail('Slow-Inc', 'MangaDock');

    expect(listCalls).toEqual([]);
    expect(repos).toEqual(['Slow-Inc/MangaDock']);
    expect(r.synced).toEqual([
      'repo:Slow-Inc/MangaDock:contributors',
      'repo:Slow-Inc/MangaDock:pulls',
      'languages:Slow-Inc/MangaDock',
      'repo:Slow-Inc/MangaDock:readme',
    ]);
    expect(r.failed).toEqual([]);
    expect(r.readmeSha).toBe('abc');
  });

  it('records failure without calling list sync', async () => {
    const listCalls: string[] = [];
    const syncer: ResourceSyncer = {
      syncResource: async (key) => {
        listCalls.push(key);
        return { changed: false, data: [] };
      },
    };
    const detail: DetailSyncer = {
      syncUserProfile: async () => {},
      syncRepoDetail: async () => {
        throw new Error('429');
      },
    };
    const svc = new GithubRefreshService(syncer, [], 'Slow-Inc', detail);
    const r = await svc.refreshRepoDetail('a', 'b');
    expect(listCalls).toEqual([]);
    expect(r.synced).toEqual([]);
    expect(r.failed).toEqual(['repo:a/b:contributors']);
    expect(r.readmeSha).toBeNull();
  });
});
