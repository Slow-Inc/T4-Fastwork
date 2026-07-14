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
});
