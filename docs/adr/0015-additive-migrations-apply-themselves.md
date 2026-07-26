# ADR 0015 — Additive migrations apply themselves; destructive ones stay human-gated

**Status**: Proposed
**Date**: 2026-07-26
**Relates to**: [ADR 0007](0007-db-enforced-authz-rls-is-app-admin.md) (authz lives in the database) · [ADR 0011](0011-auto-publish-public-repos-visibility-is-authorization.md) (visibility is authorization) · [ADR 0014](0014-serve-both-vercel-apps-behind-cloudflare.md) (serverless runtime) · issues #207, #194, #202, #234

**Proposed, not Accepted.** One thing in it is genuinely the developer's to grant — see *What is still
theirs to decide*. Everything else is decided here.

## Context

Adding a column stops the pipeline until a human applies a migration to production. This is not
hypothetical: `supabase/migrations/0032`, `0033` and `0034` have been written, reviewed, merged and
deployed, and are **still unapplied**. Measured consequences, all live right now:

- **`/projects` pays a failing-ladder tax on every cache miss — 3.45 s**, because
  `PROJECT_SELECT_ATTEMPTS` puts the poorer column sets last and each miss performs three failing
  selects before one that works (measured 2026-07-26 on production, #240).
- **#194's visibility badge cannot render at all**, so **#202's E2E is vacuous** — its assertions sit
  behind `E2E_EXPECT_GH_BADGE=1` and the loop body never executes while `gh_private` does not exist.
- **#193's sync recording writes nowhere.** The code degrades cleanly instead of throwing (by design,
  #205/#221), which means the degradation is permanent and silent rather than loud.
- Every future column repeats the exercise: five hand-rolled fallback ladders to extend, plus a human
  step to schedule.

The column-fallback ladders (#198) were the right mitigation for a *short* window. The window is now
open indefinitely, and its cost compounds.

### The finding that unparks this decision

#207 was parked on one question: *where does a privileged CI credential live?* **It does not need to
exist.** The backend already holds a DDL-capable credential — `DATABASE_URL` connects as the Postgres
superuser through the Supavisor pooler (that is why backend writes bypass RLS, ADR 0007), and
`drizzle-kit migrate` plus a journal in `nestjs/drizzle/meta/` are already wired as `bun run
db:migrate`. Nothing new has to be issued, stored, or rotated.

So the blocker was never the credential. It was that granting *any* automation permission to run DDL
felt like removing the guard in `CLAUDE.md`. This ADR draws the line so it is not.

## Decision

**An additive migration applies itself. A non-additive migration is refused by the machine, not by a
convention.**

1. **The classifier is the safety boundary, and it is a static property of the SQL — not a promise in
   a comment.** A migration is *additive* only if every statement is one of:
   `alter table … add column if not exists`, `create table if not exists`,
   `create index [concurrently] if not exists`, `comment on`, or `create or replace view`.
   Anything else — `drop`, `alter column`, `rename`, `truncate`, `update`, `delete`, `grant`,
   `revoke`, `alter … set not null` — makes the file non-additive. **The default is refuse:** a
   statement the classifier does not recognise is non-additive.
2. **Refusal is loud and blocking for that file only.** A non-additive migration is not applied, not
   skipped silently, and does not stop the additive ones behind it from being reported — it is
   reported as *awaiting human authorization* through the same log-based path #193 uses.
3. **The applier runs on the deploy path, not on every boot.** Coupling DDL to cold-start boot
   (option 2 in #207) is wrong here specifically because we are serverless: cold starts are frequent
   and concurrent, so every instance would contend for the advisory lock and pay latency for a check
   that is almost always a no-op. It runs once per deploy, guarded by a Postgres advisory lock so a
   concurrent deploy cannot race it.
4. **A failed migration does not roll back the deploy.** The code is already written to tolerate a
   missing column (the ladders). A failed *migration* therefore degrades to exactly today's
   behaviour, which is survivable; a failed *deploy* is not. The failure is reported, the deploy
   stands.
5. **`supabase_migrations.schema_migrations` is never written by this.** Drizzle keeps its own journal
   (`__drizzle_migrations`). That is deliberate, and it is also the sharpest hazard here — see below.

### What this explicitly does NOT change

The 🛑 production-write rule in `CLAUDE.md` stands for everything except additive DDL that has already
passed review as part of a merged PR. A data change, a seed, a backfill, a grant, a destructive
migration, and anything applied by hand through the Supabase MCP / CLI / dashboard all still require
an explicit, per-action OK. The point is to make *routine additive* schema work automatic — the North
Star's "a step that requires a human is a defect to design out" — not to weaken the guard on the
changes it was written for.

## Consequences

**What gets better.** A merged column exists in production without anyone opening a dashboard. The
fallback ladders stop being permanent infrastructure and become what they were designed to be: a
short window. `/projects` loses the 3.45 s refill tax. #194, #202 and #193's recording become genuinely live
rather than degraded-by-default.

**The sharpest hazard: two migration ledgers for one database.** `supabase/migrations/00XX` and
`nestjs/drizzle/000X` currently hold *duplicated* DDL for the same schema (`0032`↔`0007`,
`0033`↔`0008`), tracked in two separate journals. Automating one of them makes drift silent: apply via
drizzle and the Supabase ledger still believes the column is pending. **The ADR's implementation must
resolve this before the automation is switched on** — one directory is the source of truth and the
other is generated from it or deleted. Automating on top of the duplication would be worse than the
manual step it replaces.

**Failure modes, named as the third acceptance criterion of #207 requires:**

| Failure | What happens | Why it is acceptable |
|---|---|---|
| Classifier wrongly calls a destructive file additive | Prod DDL runs unreviewed | Mitigated by refuse-by-default + the classifier being unit-tested against every migration in the repo, including as a regression test on new ones |
| Classifier wrongly refuses an additive file | Column stays missing | Degrades to exactly today's behaviour; loud, not silent |
| Migration fails mid-way | Partial schema | Every statement is `if not exists`, so a re-run converges; the deploy stands |
| Two deploys race | Two appliers | Advisory lock; the loser waits and then finds nothing pending |
| Drizzle and Supabase ledgers drift | Schema state believed twice | **Unresolved — this is the blocking prerequisite above, not a residual risk** |

## What is still theirs to decide

Granting the automation permission to write DDL to production is the developer's call, and the first
run is the moment it takes effect — it would apply `0032`, `0033`, `0034`. That is the one item this
ADR does not decide for them, and why its status is **Proposed**.

Everything else — the classifier as the boundary, refuse-by-default, deploy-path over boot-path, a
failed migration not failing the deploy, and the ledger duplication being a prerequisite rather than a
detail — is decided here and does not need re-litigating when the answer comes.

## Alternatives considered

- **Option 2 from #207, migrate on backend startup.** Rejected on the runtime: ADR 0014 records that
  we are serverless, so "on boot" means "on every cold start, concurrently".
- **Option 3 from #207, stay manual but make it loud.** Rejected as a destination, kept as a
  by-product: the reporting in item 2 *is* option 3, so if the automation is never switched on, the
  gap at least stops sitting silently — which is what happened for `0032`/`0033` for over a week.
- **A separate CI credential (option 1 as originally framed).** Rejected: it creates a new privileged
  secret to store and rotate in order to reach a database the backend can already reach.
