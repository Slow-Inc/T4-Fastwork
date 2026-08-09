/**
 * Migration/policy drift between the repository and production (#282).
 *
 * Two defects motivated this, both measured on 2026-07-27:
 * - `supabase/migrations/0032`, `0033`, `0034` were merged and **unapplied for over a week**, with no
 *   signal anywhere.
 * - Production carries authorization objects that exist in **no migration file** â€” created by hand,
 *   and both were found with permissions scoped to "logged in" rather than "is admin". The pattern is
 *   exact: the objects that never went through review are the objects that are wrong.
 *
 * Expected values below come from a principle, not from re-running the classifier: a repo migration is
 * `applied` only when the database's migration ledger names it (or its numeric prefix), `pending` when
 * the ledger has no row for it, and a database object is `untracked` when no migration's SQL mentions
 * it. That is what makes the corpus assertions more than a restatement of the implementation.
 */
import { describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  classifyMigrationDrift,
  isAppliedLedgerMatch,
  migrationColumnEffects,
  migrationPolicyPatterns,
  type MigrationDriftReport,
} from '../src/github/migration-drift';

describe('isAppliedLedgerMatch â€” a ledger row names its migration (#282)', () => {
  it('matches a ledger row equal to the file stem', () => {
    expect(isAppliedLedgerMatch('0032_project_capture_trigger', '0032_project_capture_trigger')).toBe(
      true,
    );
  });

  it('matches a ledger row equal to the bare numeric prefix', () => {
    expect(isAppliedLedgerMatch('0032_project_capture_trigger', '0032')).toBe(true);
  });

  it('does not match a timestamp ledger row against a renamed file', () => {
    // The 2026-07-23 ledger note: `schema_migrations` holds timestamps for the early files that were
    // later renamed to NNNN_name. A timestamp cannot name a file, so it must never be read as "applied".
    expect(isAppliedLedgerMatch('0022_project_documents_extract_cache', '20260717222128')).toBe(false);
  });

  it('does not match an unrelated prefix', () => {
    expect(isAppliedLedgerMatch('0032_project_capture_trigger', '0031')).toBe(false);
  });
});

describe('migrationColumnEffects â€” the migration\'s provable footprint (#282)', () => {
  it('extracts a guarded column add with a schema prefix', () => {
    expect(
      migrationColumnEffects('alter table public.projects add column if not exists gh_private boolean;'),
    ).toEqual([{ table: 'projects', column: 'gh_private' }]);
  });

  it('extracts every guarded column add in a multi-statement migration', () => {
    const sql =
      'alter table projects add column if not exists last_synced_at timestamptz;\n' +
      'alter table projects add column if not exists last_sync_error text;';
    expect(migrationColumnEffects(sql)).toEqual([
      { table: 'projects', column: 'last_synced_at' },
      { table: 'projects', column: 'last_sync_error' },
    ]);
  });

  it('extracts every column from a multi-column add (0028)', () => {
    const sql =
      'alter table public.blog_posts\n' +
      'add column if not exists title_en text,\n' +
      'add column if not exists excerpt_en text,\n' +
      'add column if not exists content_en text;';
    expect(migrationColumnEffects(sql)).toEqual([
      { table: 'blog_posts', column: 'title_en' },
      { table: 'blog_posts', column: 'excerpt_en' },
      { table: 'blog_posts', column: 'content_en' },
    ]);
  });

  it('ignores statements that add no column', () => {
    expect(migrationColumnEffects('create table x (id bigint); grant select on x to anon;')).toEqual([]);
  });
});

describe('migrationPolicyPatterns â€” handles the %N$s loop templates (#282)', () => {
  it('turns an exact policy name into an exact matcher', () => {
    const [p] = migrationPolicyPatterns('create policy "members public read" on public.members');
    expect(p?.test('members public read')).toBe(true);
    expect(p?.test('admin writes categories')).toBe(false);
  });

  it('turns a %1$s template into a prefix+suffix matcher', () => {
    // 0016_rls_admin_write_public_tables builds policies in a loop; the production name never appears
    // verbatim. Without this, every loop-created policy would read as untracked.
    const patterns = migrationPolicyPatterns('create policy "admin writes %1$s" on public.%1$I');
    const matches = (n: string) => patterns.some((p) => p.test(n));
    expect(matches('admin writes categories')).toBe(true);
    expect(matches('admin writes services')).toBe(true);
    expect(matches('anon can submit a lead')).toBe(false);
  });
});

describe('classifyMigrationDrift â€” three states, reported honestly (#282)', () => {
  it('with an empty ledger, every repo migration is pending', () => {
    const report = classifyMigrationDrift(['0032_x', '0033_y', '0034_z'], [], [], ['', '', '']);
    expect(report.unverified).toEqual(['0032_x', '0033_y', '0034_z']);
    expect(report.applied).toEqual([]);
  });

  it('names a repo migration applied when the ledger holds its prefix', () => {
    const report = classifyMigrationDrift(
      ['0032_x', '0033_y', '0034_z'],
      ['0032', '0034'],
      [],
      ['', '', ''],
    );
    expect(report.applied).toEqual(['0032_x', '0034_z']);
    expect(report.unverified).toEqual(['0033_y']);
  });

  it('sends legacy timestamp rows to unmatchedLedger rather than pretending to match', () => {
    const report = classifyMigrationDrift(
      ['0032_project_capture_trigger'],
      ['20260717222128'],
      [],
      [''],
    );
    expect(report.applied).toEqual([]);
    expect(report.unverified).toEqual(['0032_project_capture_trigger']);
    expect(report.unmatchedLedger).toEqual(['20260717222128']);
  });

  it('marks a migration applied when the schema carries its column, even with a ledger that cannot name it', () => {
    // The real production case: the ledger is timestamp-only, but 0033's column exists in the schema.
    // Without this signal the checker would report every applied migration as pending â€” a false alarm.
    const report = classifyMigrationDrift(
      ['0033_project_gh_private'],
      ['20260717222128'],
      [],
      ['alter table projects add column if not exists gh_private boolean;'],
      ['projects.gh_private'],
    );
    expect(report.applied).toEqual(['0033_project_gh_private']);
    expect(report.verifiedPending).toEqual([]);
  });

  it('keeps a migration pending when its column is missing from the schema', () => {
    const report = classifyMigrationDrift(
      ['0033_project_gh_private'],
      [],
      [],
      ['alter table projects add column if not exists gh_private boolean;'],
      [],
    );
    expect(report.verifiedPending).toEqual(['0033_project_gh_private']);
  });

  it('flags a database object that appears in no migration SQL', () => {
    const report = classifyMigrationDrift(
      ['0032_x'],
      [],
      ['hand_created_policy', 'some_function'],
      ['create table projects (id bigint);'],
    );
    expect(report.untracked).toEqual(['hand_created_policy', 'some_function']);
  });

  it('does not flag an object whose name a migration mentions', () => {
    const report = classifyMigrationDrift(
      ['0005_members_rls'],
      [],
      ['members edit own row'],
      ['create policy "members edit own row" on public.members'],
    );
    expect(report.untracked).toEqual([]);
  });

  it('does not flag a policy the migrations create through a %1$s loop', () => {
    // The exact production name (`public read technologies`) never appears verbatim in 0016/0017 â€”
    // it is produced by `create policy "public read %1$s"`. Flagging it would cry wolf every run.
    const report = classifyMigrationDrift(
      ['0016_rls_admin_write_public_tables'],
      [],
      ['public read technologies', 'admin writes categories'],
      ['create policy "public read %1$s" on public.%1$I; create policy "admin writes %1$s" on public.%1$I;'],
    );
    expect(report.untracked).toEqual([]);
  });

  it('flags a hand-created policy that no migration can produce', () => {
    // The issue's second defect: objects created by hand, in no migration file. The leads policies in
    // production match this â€” no migration mentions `leads`.
    const report = classifyMigrationDrift(
      ['0005_members_rls'],
      [],
      ['anon can submit a lead', 'authenticated can read leads'],
      ['create policy "members public read" on public.members'],
    );
    expect(report.untracked).toEqual(['anon can submit a lead', 'authenticated can read leads']);
  });

  it('marks a policy-creating migration applied when its policy exists in the DB', () => {
    const report = classifyMigrationDrift(
      ['0005_members_rls'],
      [],
      [],
      ['create policy "members public read" on public.members'],
      [],
      ['members public read'],
    );
    expect(report.applied).toEqual(['0005_members_rls']);
    expect(report.verifiedPending).toEqual([]);
  });
});

/**
 * The real corpus. Expected values come from the principle in the header â€” the ledger's documented
 * state (2026-07-23: rows up to 0022 only, the rest applied out-of-band or unapplied) applied to the
 * file names. Not read back out of the classifier, which would make this vacuous.
 */
describe('the drift classifier judged against every migration in this repo (#282)', () => {
  const dir = join(import.meta.dir, '..', '..', 'supabase', 'migrations');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const sqlOf = (f: string) => readFileSync(join(dir, f), 'utf8');
  const stems = files.map((f) => f.replace(/\.sql$/, ''));

  it('finds the corpus â€” an empty scan would pass every assertion below', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it('reports the three migrations the ledger has no row for as verified pending', () => {
    // The ledger's documented state: rows only up to 0022, 0023+ applied out-of-band or unapplied.
    // 0032/0033/0034 are the three this issue exists because of — their column footprint is expected
    // but (with an empty schema snapshot) not present.
    const report = classifyMigrationDrift(stems, [], [], files.map(sqlOf));
    for (const f of ['0032_project_capture_trigger', '0033_project_gh_private', '0034_project_sync_health']) {
      expect(report.verifiedPending, `${f} must read verifiedPending with an empty ledger`).toContain(f);
    }
  });

  it('marks those three applied when the ledger names their prefix', () => {
    const report = classifyMigrationDrift(
      stems,
      ['0032', '0033', '0034'],
      [],
      files.map(sqlOf),
    );
    for (const f of ['0032_project_capture_trigger', '0033_project_gh_private', '0034_project_sync_health']) {
      expect(report.applied, `${f} must read applied when the ledger holds 0032/0033/0034`).toContain(f);
    }
  });

  it('matches a real policy name that a migration creates, so it is not flagged untracked', () => {
    // A real policy from 0005_members_rls.sql. If the DB names it and a migration creates it, the
    // drift checker must NOT report it â€” reporting it would cry wolf on every run.
    const report = classifyMigrationDrift(stems, [], ['members edit own row'], files.map(sqlOf));
    expect(report.untracked).toEqual([]);
  });

  it('flags an authorization object that exists in no migration', () => {
    // The issue's second defect: hand-created objects with no migration. A name that no migration
    // mentions must surface as untracked so the follow-up is actionable without a second investigation.
    const report = classifyMigrationDrift(stems, [], ['anon can do anything'], files.map(sqlOf));
    expect(report.untracked).toEqual(['anon can do anything']);
  });

  it('returns a complete report shape for the whole corpus', () => {
    // With no schema snapshot, nothing can be proven applied; migrations with a detectable footprint
    // (columns/policies) read verifiedPending, and the footprint-less ones read unverified. The three
    // buckets together cover every repo migration.
    const report = classifyMigrationDrift(stems, [], [], files.map(sqlOf));
    expect(report.applied).toEqual([]);
    expect(
      report.applied.length + report.verifiedPending.length + report.unverified.length,
    ).toBe(files.length);
    expect(report.untracked).toEqual([]);
    expect(report.unmatchedLedger).toEqual([]);
  });

  // typed guard: the report fields are what the script consumes
  const _shape: MigrationDriftReport = { applied: [], verifiedPending: [], unverified: [], untracked: [], unmatchedLedger: [] };
  void _shape;
});

