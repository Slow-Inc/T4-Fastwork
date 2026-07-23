import { describe, it, expect } from 'bun:test';
import { taxonomySlug } from '../src/github/taxonomy-ensure';

describe('taxonomySlug', () => {
  it('slugifies display names for taxonomy rows', () => {
    expect(taxonomySlug('AI Product')).toBe('ai-product');
    expect(taxonomySlug('Next.js')).toBe('next-js');
    expect(taxonomySlug('  OCR  ')).toBe('ocr');
  });

  it('falls back when the name has no alphanumerics', () => {
    expect(taxonomySlug('---')).toBe('item');
  });
});
