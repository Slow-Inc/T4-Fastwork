import { describe, it, expect } from 'bun:test';
import { githubLogin, parseRepos, type LiveRepo } from './github';

describe('githubLogin', () => {
  it('extracts the login from a profile URL', () => {
    expect(githubLogin('https://github.com/xenodeve')).toBe('xenodeve');
    expect(githubLogin('https://github.com/akkanop-x')).toBe('akkanop-x');
    expect(githubLogin('https://github.com/CableMoMo2027/')).toBe('CableMoMo2027');
  });

  it('returns null for missing or non-GitHub URLs', () => {
    expect(githubLogin(undefined)).toBeNull();
    expect(githubLogin('https://example.com/x')).toBeNull();
  });
});

describe('parseRepos', () => {
  it('returns the data array from the read-API payload', () => {
    const repos: LiveRepo[] = [
      {
        name: 'r',
        description: null,
        language: 'TypeScript',
        stargazers_count: 3,
        html_url: 'https://github.com/x/r',
        pushed_at: '2026-07-13T00:00:00Z',
      },
    ];
    expect(parseRepos({ data: repos, stale: false })).toEqual(repos);
  });

  it('returns null for null / missing / non-array data (→ fallback)', () => {
    expect(parseRepos(null)).toBeNull();
    expect(parseRepos({ data: null })).toBeNull();
    expect(parseRepos({})).toBeNull();
    expect(parseRepos({ data: 'nope' })).toBeNull();
  });
});
