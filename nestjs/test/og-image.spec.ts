import { describe, it, expect } from 'bun:test';
import { extractOgImage } from '../src/github/og-image.ts';

const base = 'https://mangadock.com';

describe('extractOgImage', () => {
  it('extracts an absolute og:image URL', () => {
    const html = `<head><meta property="og:image" content="https://cdn.x/cover.png"></head>`;
    expect(extractOgImage(html, base)).toBe('https://cdn.x/cover.png');
  });

  it('resolves a relative og:image against the page URL', () => {
    const html = `<meta property="og:image" content="/assets/og.jpg">`;
    expect(extractOgImage(html, base)).toBe('https://mangadock.com/assets/og.jpg');
  });

  it('accepts name="og:image" and twitter:image as fallbacks', () => {
    expect(
      extractOgImage('<meta name="og:image" content="https://x/a.png">', base),
    ).toBe('https://x/a.png');
    expect(
      extractOgImage(
        '<meta name="twitter:image" content="https://x/t.png">',
        base,
      ),
    ).toBe('https://x/t.png');
  });

  it('prefers og:image over twitter:image', () => {
    const html =
      '<meta name="twitter:image" content="https://x/t.png">' +
      '<meta property="og:image" content="https://x/og.png">';
    expect(extractOgImage(html, base)).toBe('https://x/og.png');
  });

  it('returns null when there is no image meta', () => {
    expect(extractOgImage('<title>no image</title>', base)).toBeNull();
    expect(extractOgImage('', base)).toBeNull();
  });
});
