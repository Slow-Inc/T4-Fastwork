import { test, expect, describe } from 'bun:test';
import { resolveLocale, LOCALES, DEFAULT_LOCALE } from './locale';

describe('resolveLocale', () => {
  test('defaults to Thai when no cookie', () => {
    expect(resolveLocale(undefined)).toBe('th');
    expect(resolveLocale('')).toBe('th');
  });

  test('accepts a supported locale', () => {
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale('th')).toBe('th');
  });

  test('falls back to default for an unsupported value', () => {
    expect(resolveLocale('fr')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('xx')).toBe('th');
  });

  test('LOCALES contains th and en', () => {
    expect(LOCALES).toContain('th');
    expect(LOCALES).toContain('en');
  });
});
