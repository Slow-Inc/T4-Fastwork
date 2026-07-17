import { describe, it, expect } from 'bun:test';
import { parseAllowedOrigins } from '../src/cors-origins';

describe('parseAllowedOrigins', () => {
  it('parses a single origin', () => {
    expect(parseAllowedOrigins('https://t4labs.dev')).toEqual([
      'https://t4labs.dev',
    ]);
  });

  it('parses a comma-separated list, trimming whitespace', () => {
    expect(
      parseAllowedOrigins(
        'https://t4labs.dev, https://t4labs.co ,https://t4-fastwork-nextjs.vercel.app',
      ),
    ).toEqual([
      'https://t4labs.dev',
      'https://t4labs.co',
      'https://t4-fastwork-nextjs.vercel.app',
    ]);
  });

  it('drops empty entries (trailing/double commas)', () => {
    expect(parseAllowedOrigins('https://a.com,,https://b.com,')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('falls back to localhost:3000 when unset/blank (dev default)', () => {
    expect(parseAllowedOrigins(undefined)).toEqual(['http://localhost:3000']);
    expect(parseAllowedOrigins('')).toEqual(['http://localhost:3000']);
    expect(parseAllowedOrigins('   ')).toEqual(['http://localhost:3000']);
  });
});
