import { describe, it, expect } from 'bun:test';
import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('My First Post')).toBe('my-first-post');
  });

  it('drops punctuation and collapses repeats', () => {
    expect(slugify('Hello,   World!! — Again')).toBe('hello-world-again');
  });

  it('keeps Thai characters', () => {
    expect(slugify('ทำ AI Chatbot')).toBe('ทำ-ai-chatbot');
  });

  it('trims surrounding whitespace and hyphens', () => {
    expect(slugify('  spaced out  ')).toBe('spaced-out');
  });

  it('returns empty for punctuation-only input', () => {
    expect(slugify('!!!')).toBe('');
  });
});
