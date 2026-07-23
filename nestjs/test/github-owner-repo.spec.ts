import { describe, it, expect } from 'bun:test';
import { parseSafeGithubOwnerRepo } from '../src/github/github.config';

describe('parseSafeGithubOwnerRepo (#143)', () => {
  it('accepts GitHub-safe owner/repo segments', () => {
    expect(parseSafeGithubOwnerRepo('Slow-Inc', 'MangaDock')).toEqual({
      owner: 'Slow-Inc',
      repo: 'MangaDock',
    });
    expect(parseSafeGithubOwnerRepo('akkanop-x', 'next.js')).toEqual({
      owner: 'akkanop-x',
      repo: 'next.js',
    });
  });

  it('rejects missing, empty, or path/query-injection segments', () => {
    expect(parseSafeGithubOwnerRepo(undefined, 'MangaDock')).toBeNull();
    expect(parseSafeGithubOwnerRepo('Slow-Inc', undefined)).toBeNull();
    expect(parseSafeGithubOwnerRepo('', 'MangaDock')).toBeNull();
    expect(parseSafeGithubOwnerRepo('Slow-Inc', '')).toBeNull();
    expect(parseSafeGithubOwnerRepo('foo/bar', 'repo')).toBeNull();
    expect(parseSafeGithubOwnerRepo('owner', 'a/b')).toBeNull();
    expect(parseSafeGithubOwnerRepo('../x', 'repo')).toBeNull();
    expect(parseSafeGithubOwnerRepo('owner', 'repo?x=1')).toBeNull();
    expect(parseSafeGithubOwnerRepo('ow ner', 'repo')).toBeNull();
    expect(parseSafeGithubOwnerRepo('https://evil.com', 'x')).toBeNull();
  });
});
