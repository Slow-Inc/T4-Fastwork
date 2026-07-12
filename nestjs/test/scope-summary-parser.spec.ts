import { describe, it, expect } from 'bun:test';
import { parseScopeSummaryResponse } from '../src/chat/scope-summary-parser';

describe('parseScopeSummaryResponse', () => {
  it('parses a clean JSON object', () => {
    const raw = JSON.stringify({
      hasEnoughInfo: true,
      projectType: 'เว็บอสังหาริมทรัพย์',
      budgetRange: '15,000–60,000 บาท',
      timeline: 'ประเมินหลังสรุปขอบเขตงาน',
      notes: 'ต้องการระบบค้นหาบ้านตามทำเล',
    });
    const r = parseScopeSummaryResponse(raw);
    expect(r).toEqual({
      hasEnoughInfo: true,
      projectType: 'เว็บอสังหาริมทรัพย์',
      budgetRange: '15,000–60,000 บาท',
      timeline: 'ประเมินหลังสรุปขอบเขตงาน',
      notes: 'ต้องการระบบค้นหาบ้านตามทำเล',
    });
  });

  it('extracts JSON wrapped in a markdown code fence', () => {
    const raw =
      '```json\n{"hasEnoughInfo": false, "projectType": null, "budgetRange": null, "timeline": null, "notes": null}\n```';
    const r = parseScopeSummaryResponse(raw);
    expect(r.hasEnoughInfo).toBe(false);
    expect(r.projectType).toBeNull();
  });

  it('falls back to hasEnoughInfo: false on malformed JSON', () => {
    const r = parseScopeSummaryResponse('not json at all');
    expect(r).toEqual({
      hasEnoughInfo: false,
      projectType: null,
      budgetRange: null,
      timeline: null,
      notes: null,
    });
  });

  it('falls back to hasEnoughInfo: false on empty input', () => {
    const r = parseScopeSummaryResponse('');
    expect(r.hasEnoughInfo).toBe(false);
  });

  it('coerces non-string fields to null rather than throwing', () => {
    const raw = JSON.stringify({
      hasEnoughInfo: true,
      projectType: 123,
      budgetRange: [],
      timeline: {},
      notes: 'ok',
    });
    const r = parseScopeSummaryResponse(raw);
    expect(r.projectType).toBeNull();
    expect(r.budgetRange).toBeNull();
    expect(r.timeline).toBeNull();
    expect(r.notes).toBe('ok');
  });
});
