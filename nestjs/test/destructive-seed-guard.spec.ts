/**
 * A destructive seed must refuse a database it was not pointed at deliberately (#269).
 *
 * `seed.ts`, `seed-members.ts` and `seed-member-content.ts` open `process.env.DATABASE_URL` and
 * start deleting content tables. By this repo's own env convention `.env` holds the PRODUCTION
 * connection string, so the failure mode is not exotic: one `bun run db:seed` in the wrong shell
 * deletes the live showcase — and `seed-data.ts` no longer contains what would be deleted, so the
 * script cannot put it back.
 *
 * The guard is deliberately shaped as "local is fine, anything else needs saying so out loud",
 * because a Supabase branch is a legitimate remote target and blocking it outright would push
 * someone into commenting the guard out.
 */
import { describe, expect, it } from 'bun:test';
import { assertDestructiveSeedAllowed } from '../src/database/destructive-seed-guard';

const LOCAL = 'postgresql://postgres:pw@localhost:5432/postgres';
const REMOTE =
  'postgresql://postgres.example:pw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

describe('assertDestructiveSeedAllowed (#269)', () => {
  it('allows a local host without any opt-in', () => {
    for (const host of [
      'localhost',
      '127.0.0.1',
      '[::1]',
      'db.internal.local',
    ]) {
      const url = `postgresql://postgres:pw@${host}:5432/postgres`;
      expect(() =>
        assertDestructiveSeedAllowed({ databaseUrl: url, allow: undefined }),
      ).not.toThrow();
    }
  });

  it('refuses a non-local host and names it, so the message is actionable', () => {
    expect(() =>
      assertDestructiveSeedAllowed({ databaseUrl: REMOTE, allow: undefined }),
    ).toThrow(/pooler\.supabase\.com/);
  });

  it('tells the refused operator how to override', () => {
    let message = '';
    try {
      assertDestructiveSeedAllowed({ databaseUrl: REMOTE, allow: undefined });
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).toContain('SEED_ALLOW_DESTRUCTIVE');
  });

  it('allows a non-local host when the opt-in is set, so a branch stays seedable', () => {
    expect(() =>
      assertDestructiveSeedAllowed({ databaseUrl: REMOTE, allow: '1' }),
    ).not.toThrow();
  });

  it('ignores an opt-in that is not an explicit yes', () => {
    for (const allow of ['', '0', 'false', 'no']) {
      expect(() =>
        assertDestructiveSeedAllowed({ databaseUrl: REMOTE, allow }),
      ).toThrow();
    }
  });

  it('fails closed on a URL it cannot parse, rather than assuming local', () => {
    expect(() =>
      assertDestructiveSeedAllowed({ databaseUrl: 'not a url', allow: undefined }),
    ).toThrow();
  });

  it('fails closed when DATABASE_URL is missing entirely', () => {
    expect(() =>
      assertDestructiveSeedAllowed({ databaseUrl: undefined, allow: undefined }),
    ).toThrow(/DATABASE_URL/);
  });

  it('still refuses a missing URL even with the opt-in — the flag is not a bypass', () => {
    // The flag says "I know this is remote", not "skip validation".
    expect(() =>
      assertDestructiveSeedAllowed({ databaseUrl: undefined, allow: '1' }),
    ).toThrow(/DATABASE_URL/);
  });
});
