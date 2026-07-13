import { describe, it, expect } from 'bun:test';
import { teamSlug } from './team-slug';

describe('teamSlug', () => {
  it('produces a url-safe slug for every real handle', () => {
    expect(teamSlug('Slowgers')).toBe('slowgers');
    expect(teamSlug('_InI4')).toBe('ini4'); // strips leading underscore
    expect(teamSlug('xenodev')).toBe('xenodev');
    expect(teamSlug('akkanop-x')).toBe('akkanop-x'); // keeps internal hyphen
    expect(teamSlug("Thanathorn'Z")).toBe('thanathornz'); // drops apostrophe
    expect(teamSlug('Paradise')).toBe('paradise');
  });

  it('is idempotent', () => {
    for (const h of ['Slowgers', '_InI4', "Thanathorn'Z", 'akkanop-x']) {
      expect(teamSlug(teamSlug(h))).toBe(teamSlug(h));
    }
  });
});
