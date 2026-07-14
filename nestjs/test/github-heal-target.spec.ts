import { describe, it, expect } from 'bun:test';
import { resolveHealTarget } from '../src/github/github.config';

describe('resolveHealTarget', () => {
  it('maps list/profile keys to their URL with no readme decode', () => {
    expect(resolveHealTarget('repos:xenodeve')).toEqual({
      url: 'https://api.github.com/users/xenodeve/repos?per_page=100&sort=pushed',
      readme: false,
    });
    expect(resolveHealTarget('org:Slow-Inc')).toEqual({
      url: 'https://api.github.com/orgs/Slow-Inc/repos?per_page=100&sort=pushed',
      readme: false,
    });
    expect(resolveHealTarget('user:xenodeve')).toEqual({
      url: 'https://api.github.com/users/xenodeve',
      readme: false,
    });
  });

  it('maps repo-detail keys', () => {
    expect(resolveHealTarget('repo:Slow-Inc/MangaDock:contributors')).toEqual({
      url: 'https://api.github.com/repos/Slow-Inc/MangaDock/contributors?per_page=100',
      readme: false,
    });
    expect(resolveHealTarget('repo:Slow-Inc/MangaDock:pulls')).toEqual({
      url: 'https://api.github.com/repos/Slow-Inc/MangaDock/pulls?state=open&per_page=100',
      readme: false,
    });
  });

  it('flags readme keys as needing a decode (parseReadme)', () => {
    expect(resolveHealTarget('repo:Slow-Inc/MangaDock:readme')).toEqual({
      url: 'https://api.github.com/repos/Slow-Inc/MangaDock/readme',
      readme: true,
    });
    expect(resolveHealTarget('user:xenodeve:readme')).toEqual({
      url: 'https://api.github.com/repos/xenodeve/xenodeve/readme',
      readme: true,
    });
  });

  it('returns null for unknown / non-healable keys', () => {
    expect(resolveHealTarget('delivery:abc123')).toBeNull();
    expect(resolveHealTarget('nonsense')).toBeNull();
    expect(resolveHealTarget('')).toBeNull();
  });

  // Defense-in-depth: the login/org/owner/repo segments must be a GitHub-safe
  // charset so nothing can smuggle path/query characters into the fixed
  // api.github.com URL (`/`, `..`, `?`, `#`, whitespace). Host/protocol are
  // already fixed; this removes even path-level latitude.
  it('rejects keys whose segments contain path/query-injection characters', () => {
    expect(resolveHealTarget('repos:foo/bar')).toBeNull();
    expect(resolveHealTarget('repos:foo?x=1')).toBeNull();
    expect(resolveHealTarget('repos:../../etc')).toBeNull();
    expect(resolveHealTarget('org:foo/../../x')).toBeNull();
    expect(resolveHealTarget('user:foo/bar')).toBeNull();
    expect(resolveHealTarget('user:foo/bar:readme')).toBeNull();
    expect(resolveHealTarget('repo:ow ner/MangaDock:pulls')).toBeNull();
    expect(resolveHealTarget('repo:owner/Man/goDock:pulls')).toBeNull();
  });

  it('still accepts valid GitHub logins with hyphens and repo dots', () => {
    expect(resolveHealTarget('repos:akkanop-x')).toEqual({
      url: 'https://api.github.com/users/akkanop-x/repos?per_page=100&sort=pushed',
      readme: false,
    });
    expect(resolveHealTarget('repo:Slow-Inc/next.js:readme')).toEqual({
      url: 'https://api.github.com/repos/Slow-Inc/next.js/readme',
      readme: true,
    });
  });
});
