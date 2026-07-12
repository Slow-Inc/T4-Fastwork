import { test, expect, describe } from 'bun:test';
import { scopeSummaryLines, EMPTY_SCOPE_SUMMARY } from './scope-summary';

describe('scopeSummaryLines', () => {
  test('returns no lines when there is not enough info yet', () => {
    expect(scopeSummaryLines(EMPTY_SCOPE_SUMMARY)).toEqual([]);
  });

  test('shows project type, budget, and timeline once known', () => {
    const lines = scopeSummaryLines({
      hasEnoughInfo: true,
      projectType: 'เว็บอสังหาริมทรัพย์',
      budgetRange: '15,000–60,000 บาท',
      timeline: 'ประเมินหลังสรุปขอบเขตงาน',
      notes: null,
    });
    expect(lines).toEqual([
      { label: 'ประเภทงาน', value: 'เว็บอสังหาริมทรัพย์' },
      { label: 'งบประมาณเบื้องต้น', value: '15,000–60,000 บาท' },
      { label: 'ระยะเวลา', value: 'ประเมินหลังสรุปขอบเขตงาน' },
    ]);
  });

  test('falls back to a default timeline when the AI has not estimated one', () => {
    const lines = scopeSummaryLines({
      hasEnoughInfo: true,
      projectType: 'เว็บร้านค้า',
      budgetRange: null,
      timeline: null,
      notes: null,
    });
    expect(lines.find((l) => l.label === 'ระยะเวลา')?.value).toBe(
      'ประเมินหลังสรุปขอบเขตงาน',
    );
  });

  test('includes notes when present', () => {
    const lines = scopeSummaryLines({
      hasEnoughInfo: true,
      projectType: 'เว็บร้านค้า',
      budgetRange: null,
      timeline: null,
      notes: 'ต้องการระบบตะกร้าสินค้า',
    });
    expect(lines).toContainEqual({
      label: 'requirement เพิ่มเติม',
      value: 'ต้องการระบบตะกร้าสินค้า',
    });
  });
});
