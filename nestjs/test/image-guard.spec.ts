import { describe, it, expect } from 'bun:test';
import { sanitizeImages } from '../src/chat/image-guard';

const png = (b64: string) => `data:image/png;base64,${b64}`;

describe('sanitizeImages', () => {
  it('returns [] for non-array input', () => {
    expect(sanitizeImages(undefined)).toEqual([]);
    expect(sanitizeImages(null)).toEqual([]);
    expect(sanitizeImages('nope')).toEqual([]);
    expect(sanitizeImages(42)).toEqual([]);
  });

  it('keeps valid image data URLs (png/jpeg/jpg/webp/gif)', () => {
    const imgs = [
      'data:image/png;base64,AAAA',
      'data:image/jpeg;base64,BBBB',
      'data:image/jpg;base64,CCCC',
      'data:image/webp;base64,DDDD',
      'data:image/gif;base64,EEEE',
    ];
    expect(sanitizeImages(imgs, { maxCount: 10 })).toEqual(imgs);
  });

  it('drops non-image and non-data-url entries', () => {
    const input = [
      png('AAAA'),
      'data:application/pdf;base64,ZZZZ',
      'https://example.com/x.png',
      'data:image/svg+xml;base64,PHN2Zz4=', // SVG excluded (script vector)
      '',
    ];
    expect(sanitizeImages(input)).toEqual([png('AAAA')]);
  });

  it('drops non-string entries', () => {
    expect(sanitizeImages([png('AAAA'), 123, null, {}])).toEqual([png('AAAA')]);
  });

  it('drops images larger than the byte cap', () => {
    const big = png('A'.repeat(1000)); // ~750 bytes decoded
    const small = png('AAAA');
    expect(sanitizeImages([big, small], { maxBytes: 500 })).toEqual([small]);
  });

  it('caps the number of images', () => {
    const imgs = Array.from({ length: 8 }, (_, i) => png(`AAA${i}`));
    expect(sanitizeImages(imgs, { maxCount: 3 })).toEqual(imgs.slice(0, 3));
  });

  it('never throws on malformed input', () => {
    expect(() => sanitizeImages([Symbol() as unknown as string])).not.toThrow();
  });
});
