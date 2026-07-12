import { describe, it, expect } from 'bun:test';
import {
  buildSystemPrompt,
  type RetrievedItem,
} from '../src/chat/system-prompt';

const retrieved: RetrievedItem[] = [
  { kind: 'project', ref: 'fin-track', title: 'FinTrack', summary: 'SaaS finance dashboard' },
  { kind: 'service', ref: '1', title: 'SaaS Platform', summary: 'build SaaS platforms' },
];

describe('buildSystemPrompt', () => {
  it('instructs the exact card marker formats', () => {
    const p = buildSystemPrompt({ language: 'th', retrieved });
    expect(p).toContain('[PROJECT:');
    expect(p).toContain('[SERVICE:');
  });

  it('injects each retrieved item so the model can cite it by ref', () => {
    const p = buildSystemPrompt({ language: 'th', retrieved });
    expect(p).toContain('fin-track');
    expect(p).toContain('FinTrack');
    expect(p).toContain('SaaS Platform');
  });

  it('tells the model to end with a call-to-contact (Thai)', () => {
    const p = buildSystemPrompt({ language: 'th', retrieved });
    expect(p).toContain('ติดต่อ');
  });

  it('switches to English instructions for language "en"', () => {
    const p = buildSystemPrompt({ language: 'en', retrieved });
    expect(p.toLowerCase()).toContain('english');
    expect(p).toContain('[PROJECT:');
  });

  it('handles an empty retrieval set without dangling context', () => {
    const p = buildSystemPrompt({ language: 'th', retrieved: [] });
    expect(typeof p).toBe('string');
    expect(p).toContain('[PROJECT:');
  });
});
