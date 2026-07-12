import { test, expect, describe } from 'bun:test';
import { pageAlternates } from './seo';

describe('pageAlternates', () => {
  test('self-references the given path as canonical', () => {
    const a = pageAlternates('/about');
    expect(a.canonical).toBe('/about');
  });

  test('declares th/en/x-default hreflang alternates for the same path', () => {
    const a = pageAlternates('/blog/rag-chatbot-for-business');
    expect(a.languages).toEqual({
      th: '/blog/rag-chatbot-for-business',
      en: '/blog/rag-chatbot-for-business',
      'x-default': '/blog/rag-chatbot-for-business',
    });
  });

  test('defaults to the homepage when no path is given', () => {
    const a = pageAlternates();
    expect(a.canonical).toBe('/');
    expect(a.languages.th).toBe('/');
  });
});
