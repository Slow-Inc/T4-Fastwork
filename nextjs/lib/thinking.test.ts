import { describe, it, expect } from 'bun:test';
import {
  formatThinkingDuration,
  thinkingSummaryLabel,
  thinkingBoxLabel,
} from './chat-message';

// Pure logic for the thinking box. The <ThinkingBox> client component (useState)
// is covered by `next build` + e2e — the monorepo's duplicated React breaks
// hook rendering under bun/happy-dom (see happydom.ts).

describe('formatThinkingDuration', () => {
  it('renders whole seconds', () => {
    expect(formatThinkingDuration(0)).toBe('0 วิ');
    expect(formatThinkingDuration(1400)).toBe('1 วิ');
    expect(formatThinkingDuration(2600)).toBe('3 วิ');
    expect(formatThinkingDuration(23358)).toBe('23 วิ');
  });
});

describe('thinkingSummaryLabel', () => {
  it('shows the duration when known', () => {
    expect(thinkingSummaryLabel(2000)).toBe('คิดอยู่ 2 วิ');
    expect(thinkingSummaryLabel(0)).toBe('คิดอยู่ 0 วิ');
  });

  it('falls back to a generic prompt when the duration is unknown', () => {
    expect(thinkingSummaryLabel(undefined)).toBe('ดูการคิดของ AI');
  });
});

describe('thinkingBoxLabel', () => {
  it('says "กำลังคิด…" while thinking (collapsed by default, spinner alongside)', () => {
    expect(thinkingBoxLabel(true)).toBe('กำลังคิด…');
    expect(thinkingBoxLabel(true, 5000)).toBe('กำลังคิด…');
  });

  it('shows the duration summary once done', () => {
    expect(thinkingBoxLabel(false, 8000)).toBe('คิดอยู่ 8 วิ');
    expect(thinkingBoxLabel(false)).toBe('ดูการคิดของ AI');
  });
});
