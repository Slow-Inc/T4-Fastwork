import { describe, it, expect } from 'bun:test';
import { formatProjectContext, type ProjectContextRecord } from '../src/chat/project-context';

const FULL: ProjectContextRecord = {
  slug: 'mangadock',
  title: 'MangaDock',
  titleEn: 'MangaDock',
  description: 'OCR + LLM แปลภาพมังงะอัตโนมัติ',
  content: 'สถาปัตยกรรมแบบ microservices รองรับงานแปลจำนวนมาก',
  category: 'AI Product',
  technologies: ['Next.js', 'Nest.js', 'Python'],
  tags: ['ai', 'ocr', 'llm'],
  liveUrl: 'https://github.com/Slow-Inc/MangaDock',
};

describe('formatProjectContext', () => {
  it('includes the title, category, technologies, tags, description, content, and live URL (Thai)', () => {
    const text = formatProjectContext(FULL, 'th');
    expect(text).toContain('MangaDock');
    expect(text).toContain('AI Product');
    expect(text).toContain('Next.js');
    expect(text).toContain('ocr');
    expect(text).toContain('OCR + LLM แปลภาพมังงะอัตโนมัติ');
    expect(text).toContain('สถาปัตยกรรมแบบ microservices');
    expect(text).toContain('https://github.com/Slow-Inc/MangaDock');
  });

  it('uses the English title when language is en and titleEn is set', () => {
    const text = formatProjectContext({ ...FULL, title: 'ห้ามใช้', titleEn: 'MangaDock EN' }, 'en');
    expect(text).toContain('MangaDock EN');
    expect(text).not.toContain('ห้ามใช้');
  });

  it('falls back to the Thai title in English mode when titleEn is missing', () => {
    const text = formatProjectContext({ ...FULL, titleEn: null }, 'en');
    expect(text).toContain('MangaDock');
  });

  it('omits empty/null optional fields rather than printing blank lines', () => {
    const minimal: ProjectContextRecord = {
      slug: 'bare',
      title: 'Bare Project',
      titleEn: null,
      description: null,
      content: null,
      category: null,
      technologies: [],
      tags: [],
      liveUrl: null,
    };
    const text = formatProjectContext(minimal, 'th');
    expect(text).toContain('Bare Project');
    expect(text).not.toContain('null');
    expect(text).not.toContain('undefined');
    expect(text.split('\n').every((l) => l.trim().length > 0)).toBe(true);
  });

  it('labels fields in English when language is en', () => {
    const text = formatProjectContext(FULL, 'en');
    expect(text).toContain('Technologies:');
    expect(text).toContain('Category:');
  });

  it('labels fields in Thai when language is th', () => {
    const text = formatProjectContext(FULL, 'th');
    expect(text).toContain('เทคโนโลยี:');
    expect(text).toContain('หมวดหมู่:');
  });
});
