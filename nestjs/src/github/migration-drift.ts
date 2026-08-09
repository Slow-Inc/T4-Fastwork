/**
 * Detect migration and policy drift between the repository and production (#282).
 *
 * The repository's DDL journal is `supabase/migrations/NNNN_name.sql`. Production's ledger is
 * `supabase_migrations.schema_migrations`. Nothing compares the two — and that silence hid two real
 * defects (measured 2026-07-27): `0032`/`0033`/`0034` merged but unapplied for over a week, and
 * authorization objects present in production that exist in no migration file (created by hand, both
 * scoped to "logged in" rather than "is admin").
 *
 * This module is pure — the database reads live in `scripts/migration-drift.ts`, mirroring how
 * `gate-audit.ts` splits decision from I/O.
 *
 * Why `applied` is decided from two signals: this repo's migrations were timestamp-named and later
 * renamed to `NNNN_name`, so `schema_migrations` carries versions (timestamps) that name no file. A
 * ledger-only match would report every file pending against a fully-applied production — a false
 * alarm the "cannot cry wolf" principle exists to stop. So a migration is `applied` when **either**
 * the ledger names it (stem or numeric prefix) **or** the schema carries the columns the migration
 * adds (`alter table ... add column if not exists`). The second signal is the reliable one here.
 */

export interface MigrationDriftReport {
  /** Repo migrations (stems) proven applied — by the ledger or by the schema carrying their footprint. */
  applied: string[];
  /** Repo migrations whose footprint the schema lacks — provably not applied. The actionable signal. */
  verifiedPending: string[];
  /** Repo migrations with no ledger row and no detectable footprint (grants, seeds, buckets, defaults)
   * — the schema cannot say whether they ran, so they are reported, not asserted. */
  unverified: string[];
  /** Database objects (policy/function names) that appear in no migration's SQL. */
  untracked: string[];
  /** Ledger rows that name no repo migration (e.g. legacy timestamp rows after a rename). */
  unmatchedLedger: string[];
}

/**
 * The columns a migration's SQL adds (`alter table [schema.]t add column if not exists c`). These are
 * the migration's provable footprint on the schema, so the drift checker can tell whether it ran
 * without trusting a ledger that cannot name it.
 */
export function migrationColumnEffects(sql: string): { table: string; column: string }[] {
  const effects: { table: string; column: string }[] = [];
  // One `alter table ... add column` can carry several comma-separated columns (0028 adds three),
  // each with a type (`title_en text, add column if not exists excerpt_en text`), so the trailing
  // group skips the type with [^,;]* up to the next comma or semicolon.
  const pattern =
    /alter\s+table\s+(?:if\s+exists\s+)?(?:(?:[\w."]+)\s*\.\s*)?([\w]+)\s+add\s+column\s+if\s+not\s+exists\s+([\w"]+)(?:[^,;]*)((?:,\s*add\s+column\s+if\s+not\s+exists\s+([\w"]+)(?:[^,;]*))*)/gi;
  for (const m of sql.matchAll(pattern)) {
    const table = m[1].toLowerCase();
    const columns = [m[2], ...Array.from(m[3]?.matchAll(/add\s+column\s+if\s+not\s+exists\s+([\w"]+)/gi) ?? [])]
      .map((c) => (typeof c === 'string' ? c : c[1]))
      .map((c) => c.replace(/"/g, '').toLowerCase());
    for (const column of columns) effects.push({ table, column });
  }
  return effects;
}

/**
 * The policy names a migration's SQL creates, as matchable patterns. This repo's RLS migrations build
 * policies in a loop with a `%1$s` format placeholder (`create policy "public read %1$s"` over a table
 * list), so the actual production name (`public read technologies`) never appears verbatim in the file.
 * A plain substring search would flag every loop-created policy as untracked — a false alarm. Exact
 * names match exactly; a `%N$s` template matches any name with that prefix and suffix.
 */
export function migrationPolicyPatterns(sql: string): RegExp[] {
  const patterns: RegExp[] = [];
  const re = /create\s+policy\s+"([^"]+)"/gi;
  for (const m of sql.matchAll(re)) {
    const name = m[1];
    const placeholder = name.match(/%\d+\$s/);
    if (placeholder) {
      const [pre, post] = name.split(placeholder[0]);
      patterns.push(new RegExp(`^${escapeRegExp(pre)}\\S+${escapeRegExp(post)}$`, 'i'));
    } else {
      patterns.push(new RegExp(`^${escapeRegExp(name)}$`, 'i'));
    }
  }
  return patterns;
}

/**
 * Does a `schema_migrations.version` row name this repo migration? A row can carry the full stem
 * (`0032_project_capture_trigger`) or the bare numeric prefix (`0032`). A 14-digit timestamp never
 * names a file, so it never matches.
 */
export function isAppliedLedgerMatch(fileStem: string, ledgerVersion: string): boolean {
  const stem = fileStem.toLowerCase();
  const version = ledgerVersion.toLowerCase();
  if (version === stem) return true;
  const prefix = stem.split('_')[0];
  return version === prefix || version.startsWith(`${prefix}_`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A database object is untracked when its name appears in none of the migrations' SQL. Matched as a
 * whole word so `foo` does not hide inside `foobar`; a policy name with spaces (`members edit own row`)
 * is matched literally, which is how the migrations quote it.
 */
function isMentionedInSql(name: string, sqlText: string): boolean {
  return new RegExp(`\\b${escapeRegExp(name.toLowerCase())}\\b`).test(sqlText);
}

export function classifyMigrationDrift(
  repoMigrations: string[],
  ledgerVersions: string[],
  schemaObjects: string[],
  migrationSql: string[],
  schemaColumns: string[] = [],
  existingPolicyNames: string[] = [],
): MigrationDriftReport {
  const applied: string[] = [];
  const verifiedPending: string[] = [];
  const unverified: string[] = [];
  const presentColumns = new Set(schemaColumns.map((c) => c.toLowerCase()));
  const existingPolicies = new Set(existingPolicyNames.map((p) => p.toLowerCase()));
  for (let i = 0; i < repoMigrations.length; i++) {
    const file = repoMigrations[i];
    const sql = migrationSql[i] ?? '';
    const ledgerMatched = ledgerVersions.some((v) => isAppliedLedgerMatch(file, v));
    const effects = migrationColumnEffects(sql);
    const policyPatterns = migrationPolicyPatterns(sql);
    const hasFootprint = effects.length > 0 || policyPatterns.length > 0;
    const effectsPresent =
      effects.length > 0 && effects.every((e) => presentColumns.has(`${e.table}.${e.column}`));
    const policiesPresent =
      policyPatterns.length > 0 && policyPatterns.some((p) => [...existingPolicies].some((n) => p.test(n)));
    if (ledgerMatched || effectsPresent || policiesPresent) {
      applied.push(file);
    } else if (hasFootprint) {
      verifiedPending.push(file);
    } else {
      unverified.push(file);
    }
  }

  const matchedLedger = new Set(
    ledgerVersions.filter((v) => repoMigrations.some((f) => isAppliedLedgerMatch(f, v))),
  );
  const unmatchedLedger = ledgerVersions.filter((v) => !matchedLedger.has(v));

  const sqlText = migrationSql.join('\n').toLowerCase();
  const allPolicyPatterns = migrationSql.flatMap(migrationPolicyPatterns);
  const untracked = schemaObjects.filter((o) => {
    const name = o.toLowerCase();
    if (isMentionedInSql(name, sqlText)) return false;
    return !allPolicyPatterns.some((p) => p.test(name));
  });

  return { applied, verifiedPending, unverified, untracked, unmatchedLedger };
}
