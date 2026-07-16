import { describe, it, expect } from 'bun:test';
import {
  reconcileAdmins,
  parseAdminEmails,
} from '../src/database/seed-app-admins';

describe('reconcileAdmins', () => {
  it('inserts newly-desired and deletes stale (a de-provisioned admin is removed)', () => {
    const r = reconcileAdmins(['a@x.com', 'old@x.com'], ['a@x.com', 'new@x.com']);
    expect(r.toInsert).toEqual(['new@x.com']);
    expect(r.toDelete).toEqual(['old@x.com']);
  });

  it('normalizes case + whitespace on both sides before diffing', () => {
    const r = reconcileAdmins([' A@X.com '], ['a@x.com', 'B@x.com']);
    expect(r.toInsert).toEqual(['b@x.com']);
    expect(r.toDelete).toEqual([]);
  });

  it('is a no-op when the sets already match', () => {
    const r = reconcileAdmins(['a@x.com'], ['a@x.com']);
    expect(r.toInsert).toEqual([]);
    expect(r.toDelete).toEqual([]);
  });

  it('would delete everything when desired is empty (the caller guards this case)', () => {
    const r = reconcileAdmins(['a@x.com', 'b@x.com'], []);
    expect(r.toDelete.sort()).toEqual(['a@x.com', 'b@x.com']);
    expect(r.toInsert).toEqual([]);
  });
});

describe('parseAdminEmails', () => {
  it('splits, trims, lowercases, and drops blanks', () => {
    expect(parseAdminEmails(' A@x.com , b@X.com ,, ')).toEqual([
      'a@x.com',
      'b@x.com',
    ]);
  });

  it('returns [] for empty/undefined', () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails('')).toEqual([]);
  });
});
