import { describe, it, expect } from 'bun:test';
import {
  buildGeneratePrompt,
  parseGeneratedContent,
} from '../src/github/github-generate-client';
import type { GenerateContext } from '../src/github/github-generate';

const ctx: GenerateContext = {
  readmeSha: 'abc',
  readme: 'MangaDock is an AI manga translation platform. Built with Next.js.',
  languages: { TypeScript: 1000, CSS: 200 },
  description: 'AI manga reader',
  topics: ['ai', 'ocr'],
};

describe('buildGeneratePrompt', () => {
  it('produces a system + user message grounded in the repo context', () => {
    const msgs = buildGeneratePrompt(ctx);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('system');
    expect(msgs[1].role).toBe('user');
    const user = msgs[1].content as string;
    expect(user).toContain('TypeScript');
    expect(user).toContain('AI manga reader');
    expect(user).toContain('MangaDock');
  });

  it('truncates a very long README', () => {
    const big = { ...ctx, readme: 'x'.repeat(10000) };
    const user = buildGeneratePrompt(big)[1].content as string;
    // README slice capped at 6000 (+ the fixed preamble lines)
    expect(user.length).toBeLessThan(6300);
  });
});

describe('parseGeneratedContent', () => {
  const good = JSON.stringify({
    title: 'มังงะด็อค',
    titleEn: 'MangaDock',
    description: 'แพลตฟอร์มแปลมังงะด้วย AI',
    content: 'ย่อหน้าแรก\n\nย่อหน้าสอง',
    category: 'AI/Automation',
    tags: ['RAG', 'OCR'],
    technologies: ['Next.js', 'TypeScript'],
  });

  it('parses a clean JSON object', () => {
    const r = parseGeneratedContent(good);
    expect(r.titleEn).toBe('MangaDock');
    expect(r.technologies).toEqual(['Next.js', 'TypeScript']);
  });

  it('strips a ```json fence', () => {
    const r = parseGeneratedContent('```json\n' + good + '\n```');
    expect(r.title).toBe('มังงะด็อค');
  });

  it('extracts JSON from surrounding prose', () => {
    const r = parseGeneratedContent('Here is the copy:\n' + good + '\nThanks!');
    expect(r.category).toBe('AI/Automation');
  });

  it('drops non-string array entries; category/tags stay optional', () => {
    const r = parseGeneratedContent(
      JSON.stringify({
        title: 'T',
        titleEn: 'Te',
        description: 'D',
        content: 'body',
        tags: ['ok', 42, null],
      }),
    );
    expect(r.tags).toEqual(['ok']);
    expect(r.technologies).toEqual([]);
    expect(r.category).toBe(''); // category is optional → blank is fine
  });

  it('throws on non-JSON', () => {
    expect(() => parseGeneratedContent('sorry, I cannot help')).toThrow();
  });

  it('throws when required title/description are missing', () => {
    expect(() =>
      parseGeneratedContent(JSON.stringify({ title: 'only title' })),
    ).toThrow();
  });

  it('throws when a required narrative field (titleEn/content) is missing (#75)', () => {
    // A partial model reply must be skipped, not written — otherwise the empty
    // string blanks title_en / content on the project row.
    expect(() =>
      parseGeneratedContent(
        JSON.stringify({ title: 'T', titleEn: 'Te', description: 'D' }), // no content
      ),
    ).toThrow();
    expect(() =>
      parseGeneratedContent(
        JSON.stringify({ title: 'T', description: 'D', content: 'c' }), // no titleEn
      ),
    ).toThrow();
  });
});
