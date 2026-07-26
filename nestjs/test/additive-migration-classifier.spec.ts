/**
 * `isAdditiveMigration` — the safety boundary of ADR 0015 (#248).
 *
 * The automation is only ever allowed to apply migrations that cannot change what exists. "Additive"
 * therefore has to be a **static property of the SQL**, refused by default, not a promise in a comment
 * header — every one of `supabase/migrations/0032`–`0034` says "additive + idempotent" in its own text,
 * and a classifier that trusted that would trust anything.
 *
 * Expected values come from the SQL and from a principle, never from running the classifier:
 * **a statement that changes authorization, data, or the meaning of an existing object is not additive.**
 * That is what makes the corpus assertions below more than a restatement of the implementation.
 */
import { describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isAdditiveMigration } from '../src/github/additive-migration';
// `readdirSync`/`readFileSync`/`join` are used by the corpus block below.

describe('isAdditiveMigration — refuses by default (#248)', () => {
  it('accepts a guarded column add, the case ADR 0015 exists for', () => {
    const sql = `-- add a nullable column\nalter table projects\n  add column if not exists gh_private boolean;`;
    expect(isAdditiveMigration(sql)).toMatchObject({ additive: true });
  });

  it('strips comments from a CRLF file, which every migration in this repo is', () => {
    // Found by running the classifier over `supabase/migrations/`: all three pending migrations were
    // refused because of their own header comments. `.` in JS does not match `\r` (it is a line
    // terminator), so `/--.*$/` matched nothing on a CRLF line and the comment survived into the
    // statement. A classifier that trips over line endings would refuse every real migration — the
    // failure mode is silent uselessness, not a wrong apply, which is why it needs a test.
    const crlf =
      '-- Additive + nullable. DO NOT apply without authz.\r\n' +
      'alter table projects\r\n  add column if not exists gh_private boolean;\r\n';
    expect(isAdditiveMigration(crlf)).toMatchObject({ additive: true });
  });

  it('refuses an unguarded column add — re-running it would error', () => {
    // `if not exists` is not politeness: without it the applier cannot be safely re-run, which is the
    // property that lets a failed run converge instead of needing a human to reason about state.
    const res = isAdditiveMigration(
      'alter table projects add column gh_private boolean;',
    );
    expect(res.additive).toBe(false);
  });

  it.each([
    ['drop', 'alter table projects drop column gh_private;'],
    ['alter column', 'alter table projects alter column title set not null;'],
    ['rename', 'alter table projects rename column title to name;'],
    ['grant', 'grant select on public.projects to anon;'],
    ['revoke', 'revoke all on public.projects from anon;'],
    ['create policy', 'create policy p on projects for select using (true);'],
    ['enable rls', 'alter table projects enable row level security;'],
    ['update', "update projects set status = 'hidden';"],
    ['delete', 'delete from projects where id = 1;'],
    ['insert', "insert into categories (name) values ('x');"],
    ['truncate', 'truncate projects;'],
    [
      'replace function',
      'create or replace function is_app_admin() returns boolean as $$ select true $$;',
    ],
    ['unrecognised syntax', 'vacuum full projects;'],
  ])('refuses %s', (_label, sql) => {
    expect(isAdditiveMigration(sql).additive).toBe(false);
  });

  it('reports every offending statement, not just the first', () => {
    // The applier logs these, so a refusal has to say what to look at.
    const mixed =
      'alter table projects add column if not exists a text;\n' +
      'grant select on projects to anon;\n' +
      "update projects set a = 'x';";
    const res = isAdditiveMigration(mixed);
    expect(res.additive).toBe(false);
    expect(res.offending).toHaveLength(2);
  });
});

/**
 * The real corpus. Expected values come from a principle — *a statement that changes authorization,
 * data, or the meaning of an existing object is not additive* — applied to the file's own text. They are
 * not read back out of the classifier, which is what would make this vacuous.
 */
describe('the classifier judged against every migration in this repo (#248)', () => {
  const dir = join(import.meta.dir, '..', '..', 'supabase', 'migrations');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const sqlOf = (f: string) => readFileSync(join(dir, f), 'utf8');
  const bodyOf = (f: string) =>
    sqlOf(f)
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((l) => l.replace(/--.*/, ''))
      .join('\n')
      .toLowerCase();

  it('finds the corpus — an empty scan would pass every assertion below', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it('accepts the three migrations the pipeline is actually blocked on', () => {
    // #194/#202 need `gh_private`, #193's recording needs `0034`, and #207 exists because none of them
    // reach production. If the classifier cannot pass these, the automation it guards is pointless.
    for (const f of [
      '0032_project_capture_trigger.sql',
      '0033_project_gh_private.sql',
      '0034_project_sync_health.sql',
    ]) {
      const v = isAdditiveMigration(sqlOf(f));
      expect(
        v.additive,
        `${f} should be additive but offended on: ${v.offending.join(' | ')}`,
      ).toBe(true);
    }
  });

  it.each([
    ['authorization (grant/revoke)', /\b(grant|revoke)\s/],
    ['row-level security policies', /create\s+policy|row\s+level\s+security/],
    ['data changes', /\b(update|delete\s+from|insert\s+into|truncate)\s/],
    ['destructive DDL', /\bdrop\s/],
    ['replacing a function or view', /create\s+or\s+replace/],
  ])('never calls a migration containing %s additive', (_what, pattern) => {
    const wrongly = files.filter(
      (f) => pattern.test(bodyOf(f)) && isAdditiveMigration(sqlOf(f)).additive,
    );
    expect(
      wrongly,
      `these were classified additive despite matching ${String(pattern)}`,
    ).toEqual([]);
  });

  it('classifies exactly 7 of the 34 as additive — a loosening must show up here', () => {
    // Not a target, a tripwire. If a future change makes this number rise, the diff has to explain why
    // the newly-accepted statements cannot change what already exists.
    const additive = files.filter(
      (f) => isAdditiveMigration(sqlOf(f)).additive,
    );
    expect(additive).toEqual([
      '0001_certificates_metadata.sql',
      '0003_ai_rank.sql',
      '0022_project_documents_extract_cache.sql',
      '0027_certificates_is_featured.sql',
      '0032_project_capture_trigger.sql',
      '0033_project_gh_private.sql',
      '0034_project_sync_health.sql',
    ]);
  });
});
