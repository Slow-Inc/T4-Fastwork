import { test, expect, describe } from 'bun:test';
import { parseCtaClick } from './cta-click';

describe('parseCtaClick', () => {
  test('accepts a valid payload', () => {
    const r = parseCtaClick({ source_page: '/', cta_type: 'hero-book-call' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.source_page).toBe('/');
      expect(r.value.cta_type).toBe('hero-book-call');
    }
  });

  test('rejects a missing source_page', () => {
    const r = parseCtaClick({ cta_type: 'hero-book-call' });
    expect(r.ok).toBe(false);
  });

  test('rejects a missing cta_type', () => {
    const r = parseCtaClick({ source_page: '/' });
    expect(r.ok).toBe(false);
  });

  test('rejects a non-object body', () => {
    expect(parseCtaClick(null).ok).toBe(false);
    expect(parseCtaClick('not-json').ok).toBe(false);
    expect(parseCtaClick(42).ok).toBe(false);
  });

  test('rejects overly long field values (abuse guard)', () => {
    const r = parseCtaClick({ source_page: '/'.padEnd(600, 'a'), cta_type: 'x' });
    expect(r.ok).toBe(false);
  });
});
