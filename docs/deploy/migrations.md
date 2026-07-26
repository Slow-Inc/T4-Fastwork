# Migrations — where DDL goes, and what applies it

One page, because the answer was previously spread across two runbooks and two migration folders that
disagreed. Decision record: [ADR 0015](../adr/0015-additive-migrations-apply-themselves.md) (#247).

## Where a new column goes

| You are changing | Put it in | Why |
|---|---|---|
| the schema the ORM types come from | `nestjs/src/database/schema/*.ts` | Drizzle reads this for types. It is **not** a migration mechanism. |
| the actual DDL | **`supabase/migrations/NNNN_name.sql`** | This is the source of truth. Numbered, additive, idempotent. |
| nothing | ~~`nestjs/drizzle/*.sql`~~ | **History only.** Frozen — a test fails if a file appears here (`nestjs/test/drizzle-folder-is-history.spec.ts`). |

Write every migration **additive and idempotent**: `add column if not exists`,
`create table if not exists`, `create index if not exists`. That is not politeness — it is what makes
re-application safe and what an automated applier is allowed to run at all (ADR 0015).

## What applies it

**The Supabase migration path** — `supabase/migrations/` via the Supabase MCP `apply_migration`, or
`supabase db push`. It writes `supabase_migrations.schema_migrations` itself; **never hand-write that
table.**

🛑 **Applying to production is a stop-and-authorize action** (`CLAUDE.md`). Verify on a Supabase branch
or localhost first, then surface the exact write and wait for an explicit OK **for that write**. A
merge approval, a deploy approval, or "keep going" is **not** that authorization.

### What does NOT apply it, and why the scripts are gone

`db:migrate` and `db:push` were removed from `nestjs/package.json` (#247). They ran through Drizzle's
own ledger (`drizzle.__drizzle_migrations`), which means:

- **They leave the Supabase ledger stale.** Apply through Drizzle and
  `supabase_migrations.schema_migrations` still claims the migration is pending. Measured 2026-07-27:
  prod carries both ledgers — 7 Drizzle rows (last 2026-07-15) against 35 Supabase rows.
- **They cannot apply everything.** `supabase/migrations/0034` has no Drizzle counterpart at all.
- **Their safety rested on a hand-maintained journal.** `nestjs/drizzle/0000`–`0006` are *not*
  idempotent (`0000`: 21 statements, one `IF NOT EXISTS`). They do not re-run only because the journal
  records them as applied — and that record was kept accurate by inserting rows by hand
  (`showcase-go-live-runbook.md`), the same class of act `CLAUDE.md` forbids for the Supabase ledger.
- `db:push` was the worse of the two: it diffs the schema and applies whatever it infers, with no file
  to review and nothing stating whether the change was additive.

`db:generate` stays. It is schema tooling, not an apply path — but if it produces a `.sql`, discard it
and write the DDL in `supabase/migrations/` instead. The frozen-folder test will tell you.

### Residual risk, stated

Removing the scripts does not stop someone typing `bunx drizzle-kit migrate`. Two Drizzle migrations
(`0007`, `0008` — duplicates of `supabase/migrations/0032`/`0033`) are still pending in prod's Drizzle
journal, so that command *would* apply `gh_private` and `last_capture_trigger` and leave the Supabase
ledger stale. Don't. Use the Supabase path, which records both the change and the fact of it.
