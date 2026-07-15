import { test, expect, describe } from 'bun:test';
import { deriveTeamTechnologies, teamTechnologies } from './site';

describe('deriveTeamTechnologies', () => {
  test('returns the deduped, sorted union of every member stack', () => {
    const members = [
      { stack: ['React', 'Next.js'] },
      { stack: ['Next.js', 'Vue.js'] },
      { skills: ['Project Manager'] }, // no stack — ignored
    ];
    expect(deriveTeamTechnologies(members)).toEqual([
      'Next.js',
      'React',
      'Vue.js',
    ]);
  });
});

describe('teamTechnologies (derived from the real team)', () => {
  test('has no duplicates', () => {
    expect(new Set(teamTechnologies).size).toBe(teamTechnologies.length);
  });
});
