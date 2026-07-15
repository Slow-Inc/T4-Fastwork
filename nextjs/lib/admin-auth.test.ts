import { test, expect, describe } from 'bun:test';
import { isAllowedAdmin } from './admin-auth';

describe('isAllowedAdmin', () => {
  test('empty/unset allowlist → nobody is admin (fail closed)', () => {
    // Members can authenticate (GitHub OAuth), so an empty allowlist must NOT admit
    // everyone or any member could reach /admin — set ADMIN_EMAILS to grant access.
    expect(isAllowedAdmin('anyone@example.com', undefined)).toBe(false);
    expect(isAllowedAdmin('anyone@example.com', '')).toBe(false);
    expect(isAllowedAdmin('anyone@example.com', '  ,  ')).toBe(false);
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
