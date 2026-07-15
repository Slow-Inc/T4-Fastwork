import { describe, it, expect } from 'bun:test';
import { githubLoginFromUser, parseTechList } from './member-auth';

describe('githubLoginFromUser', () => {
  it('reads the lowercased GitHub login from user_name', () => {
    expect(
      githubLoginFromUser({ user_metadata: { user_name: 'XenoDeve' } }),
    ).toBe('xenodeve');
  });

  it('falls back to preferred_username', () => {
    expect(
      githubLoginFromUser({ user_metadata: { preferred_username: 'AkkaNop-X' } }),
    ).toBe('akkanop-x');
  });

  it('returns null when no login is present', () => {
    expect(githubLoginFromUser({ user_metadata: {} })).toBeNull();
    expect(githubLoginFromUser(null)).toBeNull();
    expect(githubLoginFromUser(undefined)).toBeNull();
  });
});

describe('parseTechList', () => {
  it('splits on commas, trims, drops empties, and de-dupes (case-insensitive)', () => {
    expect(parseTechList('React, Next.js ,  , react')).toEqual([
      'React',
      'Next.js',
    ]);
  });

  it('returns [] for a blank string', () => {
    expect(parseTechList('   ')).toEqual([]);
  });
});
