import { describe, it, expect } from 'bun:test';
import {
  buildSystemPrompt,
  type RetrievedItem,
} from '../src/chat/system-prompt';
import type { ProjectContextRecord } from '../src/chat/project-context';

const retrieved: RetrievedItem[] = [
  {
    kind: 'project',
    ref: 'fin-track',
    title: 'FinTrack',
    summary: 'SaaS finance dashboard',
  },
  {
    kind: 'service',
    ref: '1',
    title: 'SaaS Platform',
    summary: 'build SaaS platforms',
  },
];

const activeProject: ProjectContextRecord = {
  slug: 'mangadock',
  title: 'MangaDock',
  titleEn: 'MangaDock',
  description: 'OCR + LLM แปลภาพมังงะอัตโนมัติ',
  content: null,
  category: 'AI Product',
  technologies: ['Next.js'],
  tags: ['ai'],
  liveUrl: null,
};

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

  it('injects the active project as ground truth when the visitor is viewing it', () => {
    const p = buildSystemPrompt({
      language: 'th',
      retrieved: [],
      activeProject,
    });
    expect(p).toContain('MangaDock');
    expect(p).toContain('AI Product');
    expect(p).toContain('OCR + LLM แปลภาพมังงะอัตโนมัติ');
  });

  it('omits any active-project block when none is viewing', () => {
    const p = buildSystemPrompt({ language: 'th', retrieved });
    expect(p).not.toContain('MangaDock');
  });

  it('renders the active-project block in English for language "en"', () => {
    const p = buildSystemPrompt({
      language: 'en',
      retrieved: [],
      activeProject,
    });
    expect(p).toContain('MangaDock');
    expect(p.toLowerCase()).toContain('currently viewing');
  });

  // #30 — the prompt must pin the team's real stats so the model can't invent
  // inflated numbers (e.g. "20 years / 500 projects").
  it('pins the real TH stats and forbids inventing them', () => {
    const p = buildSystemPrompt({ language: 'th', retrieved });
    expect(p).toContain('5 ปี');
    expect(p).toContain('21+');
    expect(p).toContain('ห้ามแต่งตัวเลข');
  });

  it('pins the real EN stats and forbids inventing them', () => {
    const p = buildSystemPrompt({ language: 'en', retrieved });
    expect(p).toContain('5 years');
    expect(p).toContain('21+');
    expect(p.toLowerCase()).toContain('do not invent');
  });
});
