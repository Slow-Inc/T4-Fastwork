/**
 * The safety boundary of [ADR 0015](../../../docs/adr/0015-additive-migrations-apply-themselves.md):
 * decide whether a migration is additive **from the SQL**, and refuse anything else (#248).
 *
 * Refuse-by-default is the whole design. A statement the classifier does not recognise is not additive,
 * because the alternative — allow unless it looks dangerous — means every future Postgres syntax the
 * author did not anticipate arrives pre-approved.
 *
 * ⚠️ **`create or replace view` and `create or replace function` are refused, and the ADR agrees.** The
 * ADR's first draft called the view shape additive; it is not — replacing a view changes what an existing
 * public read returns, and this repo's views are read by the anon client. The function shape is sharper
 * still: `is_app_admin()` is SECURITY DEFINER and decides admin authorization (ADR 0007). ADR 0015 was
 * corrected to match this list in #257, and `test/adr0015-additive-list-matches-classifier.spec.ts` runs
 * the ADR's own examples through `isAdditiveMigration` so the two cannot drift apart again.
 */

export interface AdditiveVerdict {
  additive: boolean;
  /** The statements that caused a refusal, trimmed for a log line. Empty when additive. */
  offending: string[];
}

/**
 * Statement shapes that cannot change an existing object, its authorization, or its data. Each is
 * anchored at the start of the statement and requires the idempotence guard where one exists, so a
 * re-run converges instead of erroring.
 */
const ADDITIVE_SHAPES: RegExp[] = [
  // alter table [schema.]t add column if not exists ...
  /^alter\s+table\s+(?:if\s+exists\s+)?[\w."]+\s+add\s+column\s+if\s+not\s+exists\s+/,
  /^create\s+table\s+if\s+not\s+exists\s+/,
  /^create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?if\s+not\s+exists\s+/,
  /^create\s+schema\s+if\s+not\s+exists\s+/,
  /^create\s+extension\s+if\s+not\s+exists\s+/,
  // Metadata only — cannot affect a read, a write, or a grant.
  /^comment\s+on\s+/,
];

/** Strip comments and split on `;` so each statement is judged on its own. */
function statements(sql: string): string[] {
  const withoutComments = sql
    .replace(/\r\n?/g, '\n') // CRLF first: `.` does not match `\r`, so `--.*` would match nothing
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((l) => l.replace(/--.*/, ''))
    .join('\n');
  return withoutComments
    .split(';')
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter((s) => s.length > 0);
}

export function isAdditiveMigration(sql: string): AdditiveVerdict {
  const offending = statements(sql).filter(
    (s) => !ADDITIVE_SHAPES.some((shape) => shape.test(s.toLowerCase())),
  );
  return {
    additive: offending.length === 0,
    offending: offending.map((s) =>
      s.length > 120 ? `${s.slice(0, 117)}...` : s,
    ),
  };
}
