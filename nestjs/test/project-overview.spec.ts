import { describe, it, expect } from 'bun:test';
import {
  filterOverviewPatch,
  parseProjectOverview,
} from '../src/github/project-overview';

const valid = {
  summary: 'ระบบแปลมังงะด้วย AI',
  highlights: 'OCR + RAG ลดงานมือ',
  goodFor: 'สตูดิโอที่อยากสเกลการแปล',
  summaryEn: 'AI manga translation system',
  highlightsEn: 'OCR + RAG cut manual work',
  goodForEn: 'Studios scaling translation',
};

describe('parseProjectOverview (#130)', () => {
  it('parses a complete bilingual structured overview', () => {
    expect(parseProjectOverview(JSON.stringify(valid))).toEqual(valid);
  });

  it('rejects incomplete JSON', () => {
    expect(() =>
      parseProjectOverview(JSON.stringify({ summary: 'x' })),
    ).toThrow(/incomplete/);
  });
});

describe('filterOverviewPatch (#130)', () => {
  it('returns the overview when owner is auto', () => {
    expect(filterOverviewPatch('auto', valid)).toEqual(valid);
  });

  it('returns null when owner is human (never clobber)', () => {
    expect(filterOverviewPatch('human', valid)).toBeNull();
  });
});
