import { describe, it, expect } from 'bun:test';
import {
  healKey,
  staleReposKeys,
  staleUserKeys,
  staleRepoDetailKeys,
  postHeal,
  scheduleHeal,
} from './heal';

// The heal keys MUST round-trip through the backend `resolveHealTarget` regex
// (nestjs/src/github/github.config.ts). These literals mirror that contract; a
// drift here = a silent no-op heal (backend returns "unhealable key").
describe('healKey builders mirror the backend snapshot keys', () => {
  it('builds member-repos, user, user-readme keys', () => {
    expect(healKey.memberRepos('xenodeve')).toBe('repos:xenodeve');
    expect(healKey.userProfile('xenodeve')).toBe('user:xenodeve');
    expect(healKey.userReadme('xenodeve')).toBe('user:xenodeve:readme');
  });

  it('builds repo-detail keys', () => {
    expect(healKey.repoContributors('Slow-Inc', 'MangaDock')).toBe(
      'repo:Slow-Inc/MangaDock:contributors',
    );
    expect(healKey.repoPulls('Slow-Inc', 'MangaDock')).toBe(
      'repo:Slow-Inc/MangaDock:pulls',
    );
    expect(healKey.repoReadme('Slow-Inc', 'MangaDock')).toBe(
      'repo:Slow-Inc/MangaDock:readme',
    );
  });
});

describe('staleReposKeys — the stale gate for /github/repos/:login', () => {
  it('returns the repos key only when the snapshot is stale', () => {
    expect(staleReposKeys('xenodeve', { data: [], stale: true })).toEqual([
      'repos:xenodeve',
    ]);
  });

  it('returns nothing when fresh, null, or missing', () => {
    expect(staleReposKeys('xenodeve', { data: [], stale: false })).toEqual([]);
    expect(staleReposKeys('xenodeve', null)).toEqual([]);
    expect(staleReposKeys('xenodeve', {})).toEqual([]);
  });
});

describe('staleUserKeys — per-field gate for /github/users/:login', () => {
  it('heals profile and readme independently by their own stale flags', () => {
    expect(
      staleUserKeys('xenodeve', {
        profile: { data: {}, stale: true },
        readme: { data: {}, stale: false },
      }),
    ).toEqual(['user:xenodeve']);

    expect(
      staleUserKeys('xenodeve', {
        profile: { data: {}, stale: false },
        readme: { data: {}, stale: true },
      }),
    ).toEqual(['user:xenodeve:readme']);

    expect(
      staleUserKeys('xenodeve', {
        profile: { data: {}, stale: true },
        readme: { data: {}, stale: true },
      }),
    ).toEqual(['user:xenodeve', 'user:xenodeve:readme']);
  });

  it('returns nothing when both fresh or null', () => {
    expect(
      staleUserKeys('xenodeve', {
        profile: { data: {}, stale: false },
        readme: null,
      }),
    ).toEqual([]);
    expect(staleUserKeys('xenodeve', null)).toEqual([]);
  });
});

describe('staleRepoDetailKeys — per-field gate for repo detail', () => {
  it('heals only the stale sub-resources', () => {
    expect(
      staleRepoDetailKeys('Slow-Inc', 'MangaDock', {
        contributors: { data: [], stale: true },
        pulls: { data: [], stale: false },
        readme: { data: {}, stale: true },
      }),
    ).toEqual([
      'repo:Slow-Inc/MangaDock:contributors',
      'repo:Slow-Inc/MangaDock:readme',
    ]);
  });

  it('returns nothing when all fresh or null', () => {
    expect(
      staleRepoDetailKeys('Slow-Inc', 'MangaDock', {
        contributors: { data: [], stale: false },
        pulls: null,
        readme: { data: {}, stale: false },
      }),
    ).toEqual([]);
    expect(staleRepoDetailKeys('Slow-Inc', 'MangaDock', null)).toEqual([]);
  });
});

describe('postHeal — secret-guarded fire-and-forget POST', () => {
  it('POSTs to /github/heal?key= with the refresh secret header', async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const fetchImpl = ((url: string, init: RequestInit) => {
      seen = { url, init };
      return Promise.resolve({ ok: true } as Response);
    }) as unknown as typeof fetch;

    const r = await postHeal('repo:Slow-Inc/MangaDock:pulls', {
      baseUrl: 'https://api.example.com',
      secret: 's3cr3t',
      fetchImpl,
    });

    expect(r.ok).toBe(true);
    expect(seen!.url).toBe(
      'https://api.example.com/github/heal?key=repo%3ASlow-Inc%2FMangaDock%3Apulls',
    );
    expect(seen!.init.method).toBe('POST');
    expect(
      (seen!.init.headers as Record<string, string>)['x-refresh-secret'],
    ).toBe('s3cr3t');
  });

  it('skips (never calls fetch) when no secret is configured', async () => {
    let called = false;
    const fetchImpl = (() => {
      called = true;
      return Promise.resolve({ ok: true } as Response);
    }) as unknown as typeof fetch;

    const r = await postHeal('repos:xenodeve', {
      baseUrl: 'https://api.example.com',
      secret: undefined,
      fetchImpl,
    });

    expect(called).toBe(false);
    expect(r.ok).toBe(false);
    expect(r.skipped).toBe('no-secret');
  });

  it('swallows network errors (heal is best-effort, never breaks the page)', async () => {
    const fetchImpl = (() =>
      Promise.reject(new Error('ECONNREFUSED'))) as unknown as typeof fetch;

    const r = await postHeal('repos:xenodeve', {
      baseUrl: 'https://api.example.com',
      secret: 's',
      fetchImpl,
    });

    expect(r.ok).toBe(false);
    expect(r.skipped).toBe('error');
  });
});

describe('scheduleHeal — registers an after() callback that heals every key', () => {
  it('registers one after() callback and fans out postHeal per key', async () => {
    const registered: Array<() => unknown> = [];
    const afterFn = (cb: () => unknown) => registered.push(cb);
    const posted: string[] = [];
    const postImpl = (key: string) => {
      posted.push(key);
      return Promise.resolve({ ok: true });
    };

    scheduleHeal(['repos:xenodeve', 'user:xenodeve'], {
      after: afterFn,
      secret: 's',
      baseUrl: 'https://api.example.com',
      postImpl,
    });

    expect(registered.length).toBe(1);
    await registered[0]();
    expect(posted).toEqual(['repos:xenodeve', 'user:xenodeve']);
  });

  it('does not register anything when there are no stale keys', () => {
    let registered = 0;
    scheduleHeal([], {
      after: () => registered++,
      secret: 's',
      baseUrl: 'https://api.example.com',
    });
    expect(registered).toBe(0);
  });
});
