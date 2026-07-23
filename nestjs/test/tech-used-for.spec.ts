import { describe, it, expect } from 'bun:test';
import {
  filterUsedForPatch,
  parseTechUsedFor,
} from '../src/github/tech-used-for';

const valid = {
  usedFor: 'ใช้สร้าง App Router frontend',
  usedForEn: 'Powers the App Router frontend',
};

describe('parseTechUsedFor (#131)', () => {
  it('parses bilingual used-for blurbs', () => {
    expect(parseTechUsedFor(JSON.stringify(valid))).toEqual(valid);
  });

  it('rejects incomplete JSON', () => {
    expect(() =>
      parseTechUsedFor(JSON.stringify({ usedFor: 'x' })),
    ).toThrow(/incomplete/);
  });
});

describe('filterUsedForPatch (#131)', () => {
  it('returns the blurb when owner is auto', () => {
    expect(filterUsedForPatch('auto', valid)).toEqual(valid);
  });

  it('returns null when owner is human', () => {
    expect(filterUsedForPatch('human', valid)).toBeNull();
  });
});
