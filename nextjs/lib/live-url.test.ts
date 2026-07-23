import { test, expect, describe } from 'bun:test';
import { normalizeHomepageToLiveUrl } from './live-url';

describe('normalizeHomepageToLiveUrl', () => {
  test('returns null for empty / whitespace / null / undefined', () => {
    expect(normalizeHomepageToLiveUrl(null)).toBeNull();
    expect(normalizeHomepageToLiveUrl(undefined)).toBeNull();
    expect(normalizeHomepageToLiveUrl('')).toBeNull();
    expect(normalizeHomepageToLiveUrl('   ')).toBeNull();
  });

  test('normalizes scheme-less homepage to https://', () => {
    expect(normalizeHomepageToLiveUrl('demo.example.com')).toBe(
      'https://demo.example.com',
    );
  });

  test('preserves absolute http(s) URLs', () => {
    expect(normalizeHomepageToLiveUrl('https://x.dev')).toBe('https://x.dev');
    expect(normalizeHomepageToLiveUrl('http://x.dev')).toBe('http://x.dev');
  });
});
