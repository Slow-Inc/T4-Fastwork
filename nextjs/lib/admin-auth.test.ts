import { test, expect, describe } from 'bun:test';
import { isAllowedAdmin } from './admin-auth';

describe('isAllowedAdmin', () => {
  test('no allowlist → any authenticated user is allowed', () => {
    expect(isAllowedAdmin('anyone@example.com', undefined)).toBe(true);
    expect(isAllowedAdmin('anyone@example.com', '')).toBe(true);
  });

  test('allowlist → only listed emails pass', () => {
    const list = 'admin@t4labs.co, boss@t4labs.co';
    expect(isAllowedAdmin('admin@t4labs.co', list)).toBe(true);
    expect(isAllowedAdmin('boss@t4labs.co', list)).toBe(true);
    expect(isAllowedAdmin('intruder@evil.com', list)).toBe(false);
  });

  test('matching is case-insensitive and trims whitespace', () => {
    expect(isAllowedAdmin('  Admin@T4Labs.co ', 'admin@t4labs.co')).toBe(true);
  });

  test('no email → never allowed', () => {
    expect(isAllowedAdmin(undefined, undefined)).toBe(false);
    expect(isAllowedAdmin(null, 'admin@t4labs.co')).toBe(false);
  });
});
