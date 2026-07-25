# A New Column Is Public By Default

Adding a column to a table the public reads is a **disclosure decision**, not a schema detail. In this
repo `public.projects` has **no column-scoped grant** — `grep -rn "grant\|revoke" supabase/migrations/*.sql`
returns nothing for it — so `anon` holds table-level `SELECT`, and a table-level grant covers every
column, including ones that do not exist yet. The publishable key ships in the browser bundle, so
anything added to that table is readable by anyone through PostgREST the moment the migration lands,
whether or not any app query selects it. The app's own explicit column lists
(`nextjs/lib/projects-select.ts`) constrain the app, not the API.

## The trap: a column-level revoke does not undo a table-level grant

The instinctive fix — `revoke select (col) on public.projects from anon` — **has no effect** while
table-level `SELECT` stands. Postgres treats the table grant as authoritative for all columns.
Restricting one column really means:

```sql
revoke select on public.projects from anon, authenticated;
grant select (id, slug, title, …every column that must stay public…) on public.projects to anon, authenticated;
```

That is high blast radius on a table every public page depends on: miss one column and public reads
break, and it is itself a production-DB write requiring explicit authorization. So it is rarely the
right move inside the PR that adds the column.

## What to do instead

**Bound the value at the source, and write the exposure down where the migration is authorized.**
Found on #193 (PR #221): `projects.last_sync_error` stores upstream error text — an LLM gateway's 4xx
body, a pooler message — which can carry internal hostnames or a credential fragment. Remediation
that shipped:

- cap the untrusted part (200 chars, matching the bound `screenshot-dispatch.ts:59` already used for
  interpolated upstream text), keep the enumerated action name we control,
- leave the full, actionable text in logs, which are not public,
- state the exposure and this grant semantics in the migration file itself, so whoever authorizes it
  decides knowingly.

The generalization: when an operational column must hold third-party text, **the DB row gets the
bounded classification and the log gets the detail.** Migration `0032`'s `last_capture_dispatch_at` /
`gh_private` share the same posture — a pre-existing systemic exposure, worth knowing before assuming
a new column inherits protection from [[Authorization Needs a Backstop]].

Repos being public makes this sharper: see [[Bilingual Pre-Merge Review Evidence]] on classifying a
security gate by **what the diff touches** — a new column on an anon-readable table is a data-exposure
question even when the feature is "just observability". Related:
[[Degraded Modes Must Be Observable]] (the log half of the split above).
