import { test, expect, describe } from 'bun:test';
import {
  deriveTeamTechnologies,
  teamTechnologies,
  experienceYears,
  metricsFromStats,
} from './site';

describe('experienceYears', () => {
  test('counts years from the start year to now (ม.3 2019 → 7 in 2026)', () => {
    expect(experienceYears(2019, 2026)).toBe(7);
  });
  test('never negative if the clock is behind the anchor', () => {
    expect(experienceYears(2019, 2018)).toBe(0);
  });
});

describe('metricsFromStats', () => {
  test('formats the live counts into the band (N+ for years/projects, plain certs)', () => {
    expect(metricsFromStats({ years: 7, projects: 21, certs: 9 })).toEqual([
      { value: '7+', label: 'Years experience' },
      { value: '21+', label: 'Projects built' },
      { value: '9', label: 'Certificates' },
      { value: 'TH·EN', label: 'Bilingual delivery' },
    ]);
  });
});

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
