import { describe, it, expect } from 'bun:test';
import {
  isCaptureUsable,
  resolveOgFallbackUrl,
  selectSnapshotTargets,
} from './snapshot-cover';

describe('isCaptureUsable', () => {
  it('rejects null/undersized captures', () => {
    expect(isCaptureUsable(null, 5_000)).toBe(false);
    expect(isCaptureUsable(new Uint8Array(100), 5_000)).toBe(false);
  });

  it('accepts captures at or above the min byte floor', () => {
    expect(isCaptureUsable(new Uint8Array(5_000), 5_000)).toBe(true);
    expect(isCaptureUsable(new Uint8Array(8_000), 5_000)).toBe(true);
  });
});

describe('resolveOgFallbackUrl', () => {
  const html =
    '<meta property="og:image" content="https://cdn.x/cover.png">';
  const pageUrl = 'https://example.com/app';

  it('returns null when Playwright capture is usable (no fallback needed)', () => {
    expect(
      resolveOgFallbackUrl({
        captureUsable: true,
        html,
        pageUrl,
      }),
    ).toBeNull();
  });

  it('returns absolute og:image when capture failed', () => {
    expect(
      resolveOgFallbackUrl({
        captureUsable: false,
        html,
        pageUrl,
      }),
    ).toBe('https://cdn.x/cover.png');
  });

  it('returns null when capture failed and HTML has no social image', () => {
    expect(
      resolveOgFallbackUrl({
        captureUsable: false,
        html: '<title>no image</title>',
        pageUrl,
      }),
    ).toBeNull();
  });

  it('returns null when capture failed and HTML is missing', () => {
    expect(
      resolveOgFallbackUrl({
        captureUsable: false,
        html: null,
        pageUrl,
      }),
    ).toBeNull();
  });
});

describe('selectSnapshotTargets', () => {
  it('keeps published rows with non-blank live_url and null snapshot', () => {
    const rows = [
      {
        id: 1,
        slug: 'a',
        status: 'published',
        live_url: 'https://a.example',
        snapshot_image: null,
      },
      {
        id: 2,
        slug: 'b',
        status: 'published',
        live_url: '',
        snapshot_image: null,
      },
      {
        id: 3,
        slug: 'c',
        status: 'draft',
        live_url: 'https://c.example',
        snapshot_image: null,
      },
      {
        id: 4,
        slug: 'd',
        status: 'published',
        live_url: 'https://d.example',
        snapshot_image: 'https://cdn/x.jpg',
      },
      {
        id: 5,
        slug: 'e',
        status: 'published',
        live_url: '  https://e.example  ',
        snapshot_image: null,
      },
    ];
    expect(selectSnapshotTargets(rows)).toEqual([
      {
        id: 1,
        slug: 'a',
        live_url: 'https://a.example',
      },
      {
        id: 5,
        slug: 'e',
        live_url: 'https://e.example',
      },
    ]);
  });
});
