/**
 * `nestjs/drizzle/` is history, not a queue (#247, ADR 0015).
 *
 * Measured 2026-07-27: production carries TWO migration ledgers — `drizzle.__drizzle_migrations`
 * (7 rows, last 2026-07-15) and `supabase_migrations.schema_migrations` (35 rows). The repo carries 9
 * drizzle migrations against 34 supabase ones, so two drizzle migrations are *pending* and are
 * content-duplicates of `supabase/migrations/0032`/`0033`, while `0034` has no drizzle counterpart at
 * all. Applying through drizzle would therefore land columns while leaving the Supabase ledger still
 * claiming they are pending — drift produced by the automation meant to remove a human step.
 *
 * ADR 0015 resolves that by making `supabase/migrations/` the source of truth. These tests make that
 * structural instead of conventional: nothing may apply through drizzle, and the folder may not grow.
 *
 * Not asserted here (it cannot be, without a database): what prod's drizzle journal actually contains.
 * That is why the guard is "the folder cannot grow" rather than "nothing is pending" — a static
 * property beats one that needs a connection to check.
 */
import { describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const NESTJS_ROOT = join(import.meta.dir, '..');
const DRIZZLE_DIR = join(NESTJS_ROOT, 'drizzle');

/**
 * The frozen set. Every entry predates ADR 0015 and is retained as inert history rather than deleted:
 * removing them would mean surgery on `drizzle/meta/` that `db:generate` would simply undo, and they
 * are harmless once nothing can apply them. A NEW name appearing here is the regression this guards —
 * new DDL belongs in `supabase/migrations/`.
 */
const FROZEN = [
  '0000_polite_krista_starr.sql',
  '0001_daffy_ulik.sql',
  '0002_clumsy_deathstrike.sql',
  '0003_safe_risque.sql',
  '0004_lying_puppet_master.sql',
  '0005_luxuriant_white_queen.sql',
  '0006_smart_green_goblin.sql',
  '0007_project_capture_trigger.sql',
  '0008_project_gh_private.sql',
];

describe('the drizzle migration folder is frozen (#247)', () => {
  it('contains exactly the historical set — a new file means DDL went to the wrong place', () => {
    const actual = readdirSync(DRIZZLE_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    expect(
      actual,
      'A migration appeared in nestjs/drizzle/. Per ADR 0015 the source of truth is ' +
        'supabase/migrations/ — put the DDL there and revert this file. If you ran ' +
        '`drizzle-kit generate`, discard what it produced: the drizzle schema TS is for ORM types, ' +
        'not for applying migrations.',
    ).toEqual(FROZEN);
  });
});

describe('no script can apply migrations through drizzle (#247)', () => {
  const scripts = (
    JSON.parse(readFileSync(join(NESTJS_ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    }
  ).scripts;

  it('has no script that runs `drizzle-kit migrate` or `drizzle-kit push`', () => {
    // `push` is the more dangerous of the two: it diffs the schema and applies whatever it infers,
    // with no migration file to review and nothing that says whether the change was additive.
    const offenders = Object.entries(scripts)
      .filter(([, cmd]) => /drizzle-kit\s+(migrate|push)/.test(cmd))
      .map(([name, cmd]) => `${name}: ${cmd}`);
    expect(
      offenders,
      'These scripts can apply DDL to production through the drizzle ledger, which leaves ' +
        'supabase_migrations.schema_migrations stale (ADR 0015). Remove them.',
    ).toEqual([]);
  });

  it('still keeps `db:generate`, because the schema TS remains the ORM type source', () => {
    // The point is to remove the *apply* path, not the schema tooling. If this ever fails, the fix
    // above went further than #247 asked.
    expect(scripts['db:generate']).toBeDefined();
  });
});
