/**
 * Report migration/policy drift between the repository and production (#282). Thin I/O wrapper — the
 * classification is in `src/github/migration-drift.ts` and is unit-tested.
 *
 *   bun run scripts/migration-drift.ts            # needs DATABASE_URL (read-only connection)
 *
 * Reads only — it never writes, and every query runs inside a `read only` transaction so a mistake
 * cannot mutate production. Reads:
 * - `supabase_migrations.schema_migrations` — what the DB ledger believes is applied.
 * - `pg_policies` / `pg_proc` for the `public` schema — the authorization objects production actually
 *   carries.
 * - `supabase/migrations/*.sql` — the repository's DDL journal.
 *
 * Exit codes are a contract for the scheduled workflow: 0 = no **provable** drift (migrations whose
 * state is unverifiable are reported as a warning, never silently), 1 = verified-unapplied migrations
 * or untracked objects, 2 = could not assess (no DATABASE_URL, or the read failed) — a 2 must never be
 * read as "clean".
 *
 * Requires the `postgres` package (a workspace dependency). Compiled by `nest build`, so no Bun-only
 * globals and no top-level `await` (the same constraint as `gate-audit.ts`).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';
import { classifyMigrationDrift } from '../src/github/migration-drift';

const MIGRATIONS_DIR = join(__dirname, '..', '..', 'supabase', 'migrations');

interface ReportRow {
  applied: string[];
  pending: string[];
  untracked: string[];
  unmatchedLedger: string[];
}

function hostOf(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return '<unparseable>';
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL is not set — cannot assess migration drift. Refusing to render a verdict.',
    );
    process.exitCode = 2;
    return;
  }

  const sql = postgres(databaseUrl, { prepare: false });

  let ledgerVersions: string[] = [];
  let policyNames: string[] = [];
  let functionNames: string[] = [];
  let schemaColumns: string[] = [];
  try {
    // `begin('read only')` guarantees the whole assessment is a single read-only transaction.
    await sql.begin('read only', async (tx) => {
      const ledger = await tx<
        { version: string }[]
      >`select version from supabase_migrations.schema_migrations`;
      ledgerVersions = ledger.map((r) => r.version);

      const policies = await tx<
        { policyname: string }[]
      >`select policyname from pg_policies where schemaname = 'public'`;
      policyNames = policies.map((r) => r.policyname);

      // Exclude extension-owned functions (pgvector etc.): they are installed by `create extension`
      // and tracked by the extension, not by a migration file, so they would flood the untracked list.
      // Extension membership is via `pg_depend` — there is no `proext` column on this server.
      const functions = await tx<
        { proname: string }[]
      >`select p.proname from pg_proc p
        where p.pronamespace = 'public'::regnamespace
          and not exists (
            select 1 from pg_depend d
            where d.classid = 'pg_proc'::regclass and d.objid = p.oid
              and d.refclassid = 'pg_extension'::regclass
          )
          and left(p.proname, 1) <> '_'
          and left(p.proname, 3) <> 'pg_'`;
      functionNames = functions.map((r) => r.proname);

      // The migration's column footprint — used to tell applied from pending without trusting a
      // timestamp-only ledger (this repo renamed its migrations after applying them).
      const columns = await tx<
        { table_name: string; column_name: string }[]
      >`select table_name, column_name
        from information_schema.columns
        where table_schema = 'public'`;
      schemaColumns = columns.map((c) => `${c.table_name}.${c.column_name}`);
    });
  } catch (err) {
    console.error(
      `could not read the database: ${err instanceof Error ? err.message : String(err).slice(0, 300)}`,
    );
    process.exitCode = 2;
    return;
  } finally {
    await sql.end();
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const stems = files.map((f) => f.replace(/\.sql$/, ''));
  const sqlTexts = files.map((f) =>
    readFileSync(join(MIGRATIONS_DIR, f), 'utf8'),
  );

  const objects = [...new Set([...policyNames, ...functionNames])];
  const report = classifyMigrationDrift(
    stems,
    ledgerVersions,
    objects,
    sqlTexts,
    schemaColumns,
    policyNames,
  );

  console.log(`Migration drift report — DB host ${hostOf(databaseUrl)}`);
  console.log(
    `  ledger rows: ${ledgerVersions.length} · repo migrations: ${stems.length} · ` +
      `public objects scanned: ${objects.length}`,
  );

  if (report.unmatchedLedger.length > 0) {
    console.log(
      `  note: ${report.unmatchedLedger.length} ledger row(s) name no repo file ` +
        `(${report.unmatchedLedger.slice(0, 5).join(', ')}${report.unmatchedLedger.length > 5 ? ', …' : ''}) — ` +
        'legacy timestamp rows from renamed files cannot be matched; reconcile via `supabase migration repair`.',
    );
  }

  if (report.verifiedPending.length === 0 && report.untracked.length === 0) {
    if (report.unverified.length > 0) {
      // Unverified is not a false alarm, but it is not proof of drift either: the ledger cannot name
      // renamed files and the footprint is undetectable, so absence of a row is not absence of an apply.
      // Report it as a warning so a human reconciles the ledger without holding the cron red on an
      // unprovable assertion (the "cannot cry wolf" rule).
      console.log(
        `  unverified (no ledger row, no detectable footprint — pending per ledger): ${report.unverified.length}`,
      );
      for (const p of report.unverified) console.log(`    ${p}`);
      console.log(
        `::warning::${report.unverified.length} migration(s) have no ledger row and no detectable ` +
          'footprint — reconcile the ledger (`supabase migration repair`) to confirm or surface real drift.',
      );
      return;
    }
    console.log(
      '  no drift: every migration is applied and every public object is migration-tracked.',
    );
    return;
  }

  if (report.verifiedPending.length > 0) {
    console.log(
      `  verified pending (footprint expected but absent — not applied): ${report.verifiedPending.length}`,
    );
    for (const p of report.verifiedPending) console.log(`    ${p}`);
  }
  if (report.unverified.length > 0) {
    console.log(
      `  unverified (no ledger row, no detectable footprint — pending per ledger): ${report.unverified.length}`,
    );
    for (const p of report.unverified) console.log(`    ${p}`);
  }
  console.log(
    `  untracked (in DB, in no migration): ${report.untracked.length}`,
  );
  for (const u of report.untracked) console.log(`    ${u}`);
  process.exitCode = 1;
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 2;
});
