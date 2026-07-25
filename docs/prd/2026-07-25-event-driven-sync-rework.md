# PRD: Event-driven sync rework — make the pipeline actually fire (and never lie)

**Parent epic:** [#185](https://github.com/Slow-Inc/T4-Fastwork/issues/185)
**Date:** 2026-07-25
**Status:** Proposed (blocks the epic #185 / #194 PR)
**Source:** `/scrutinize` on the uncommitted branch `feat/186-plan-project-automation-sync`

## Problem Statement

Epic #185 (S1–S8) and #194 are code-complete on the branch, but an outsider trace of the
real code paths shows the headline behavior does not happen, and the failure is invisible:

1. **Cover recapture never fires for a project that already has a cover.** The Nest executor
   records the capture trigger at *dispatch* time, then the GitHub Action — which starts
   ~30–60 s later — compares the incoming trigger against the value the executor just wrote,
   finds them equal, and reports "nothing to capture". "Update the cover even when the URL is
   unchanged" is the reason this epic exists, and it is the one thing that cannot work.
2. **A failed dispatch is recorded as a success.** The dispatch helper returns
   `{ dispatched: false, reason: 'http-403…' }`; the executor ignores the result and writes the
   trigger + timestamp anyway. In the current (known, unresolved) 403 state this marks every
   push as captured, and the cooldown then suppresses every retry — silently, with no log.
3. **Deploying before the migrations regresses paths that work today.** The frontend project
   read has a graceful column-fallback ladder; the backend does not. Curate's per-repo
   visibility write, the draft insert, the pipeline state load, the screenshot script's select,
   and the admin projects list all reference `gh_private` / `last_capture_*` with no guard, so a
   merge (which auto-deploys) ahead of migrations 0032/0033 breaks the curate cron, the
   screenshot cron, and the admin projects table.
4. **Work is silently dropped in three more places**: a push that loses the advisory lock is
   discarded without a log, one failing LLM call aborts every remaining action (including the
   ISR revalidate that is ordered last), and the Vercel webhook marks a delivery as seen
   *before* running the pipeline, so a throw or timeout loses that deployment permanently.
5. **The whole pipeline runs inline in a webhook request on a 60 s function**, holding a
   Postgres advisory lock inside an open transaction on the Supavisor transaction pooler for
   the duration, and may issue three LLM calls per event — against a codebase constraint that
   already caps LLM work at one per run precisely because of that 60 s budget.
6. **The safety net was weakened for a path that cannot run yet.** The refresh cron went from
   hourly to 6-hourly on the grounds that webhooks are now primary; with 1–5 unresolved, the
   net effect of merging is freshness six times worse than today.
7. **The branch is not green and not verified.** One nestjs spec fails (a red TDD test belonging
   to unstarted issue #177 that was never implemented), and the visibility badge — a frontend
   change — has no E2E coverage, which `CLAUDE.md` requires.

## Solution

Keep the planner and the slice structure; fix the contracts around them, move only the
expensive work off the request path, and refuse to record success that did not happen.

1. **One shared predicate owns "does this project need a capture for this trigger?"** Both the
   Nest planner and the Action-side selection call the same pure function, so the two sides
   cannot drift again. The Action becomes the only writer of `last_capture_trigger`, and writes
   it *after* a successful capture; Nest writes only the dispatch timestamp used for the
   cooldown.
2. **A dispatch that does not return 2xx is an error**: nothing is recorded, the failure is
   logged with the status, and the next event retries.
3. **Split the plan into fast actions and deferred actions.** The webhook executes only the
   cheap ones (live URL for the one project, auto-publish, cover dispatch, rank, revalidate)
   and defers the three LLM actions using the `DeferredActionSet` mechanism the pipeline
   already has. The cron drains the deferred ones with a cap of one LLM call per run — no new
   table and no queue, because every LLM gate is already state-derived ("empty and
   owner=auto"), so the row itself is the queue.
4. **Nothing is dropped without a trace**: a lost advisory lock returns `skipped` and logs;
   each action is isolated so one failure cannot cancel the rest; the Vercel delivery is marked
   as seen only after the pipeline resolves.
5. **The backend tolerates a missing column the way the frontend already does**, so deploy order
   stops being a live hazard, and the migrations remain a separate, explicitly-authorized step.
6. **Restore the hourly safety net** until the webhook path is observed working in production;
   relaxing it is a follow-up decision, not part of shipping this.
7. **Green and verified before the PR**: the suite passes, and the badge has an E2E case.

## User Stories

1. As the site owner, I want a project's cover to refresh after I redeploy it, so that the
   showcase does not display a screenshot of last month's design.
2. As the site owner, I want the cover to refresh even when the live URL has not changed, so
   that "same URL, new design" is not a blind spot.
3. As the site owner, I want a project's cover to refresh after I push to its repo, so that a
   README/branding change is reflected without me doing anything.
4. As the site owner, I want the second event for the same commit or deployment to be ignored,
   so that a webhook redelivery does not burn a duplicate Action run.
5. As an operator, I want a dispatch that fails authorization to be logged and retried, so that
   a token problem is visible within one event instead of after weeks of stale covers.
6. As an operator, I want the database to never claim a capture happened when it did not, so
   that I can trust `last_capture_trigger` when debugging.
7. As an operator, I want a push that arrives while another sync is running to be reported as
   skipped, so that I can tell "nothing to do" apart from "silently thrown away".
8. As an operator, I want one failing LLM call to not cancel auto-publish and cache
   revalidation, so that a partial outage degrades instead of stalling.
9. As an operator, I want the Vercel webhook to be retryable, so that a transient failure does
   not permanently lose that production deployment.
10. As an operator, I want a webhook to answer quickly and stay inside the function budget, so
    that GitHub does not record delivery timeouts and work is not killed mid-flight.
11. As an operator, I want at most one LLM call per run, so that the 60 s function budget is
    respected the same way the rest of the backend respects it.
12. As an operator, I want the connection pool not to hold an open transaction across LLM and
    HTTP calls, so that a sync cannot starve the pooler.
13. As a developer, I want to deploy the code before applying the migrations without breaking
    curate, the screenshot job, or the admin projects list, so that the release order is not a
    trap.
14. As a developer, I want the migrations to remain a separate authorized step, so that the
    production-write gate is honoured.
15. As an admin, I want to see each GitHub-sourced project's Public/Private visibility in the
    admin table, so that I can tell at a glance which repos are closed.
16. As a visitor, I want a visibility indicator on a project I am reading about, so that I know
    whether I can go read its source.
17. As a developer, I want the visibility badge covered end-to-end, so that a layout or
    hydration regression is caught before production.
18. As a developer, I want the test suite green on the branch, so that "last known green" is a
    fact rather than a claim.
19. As a developer, I want the dispatch↔Action contract covered by a test, so that this class of
    cross-process drift cannot regress silently.
20. As the site owner, I want the hourly safety net kept until the event path is proven live, so
    that the rework cannot make freshness worse than it is today.
21. As a developer, I want unwired modules and orphaned specs kept off this branch, so that the
    diff under review is only the epic.
22. As the site owner, I want filling one project's live URL to not trigger a bulk pass over
    dozens of unrelated projects, so that one push has a predictable blast radius.

## Implementation Decisions

- **Capture-eligibility predicate is extracted and shared.** A single pure function decides
  whether a project needs a capture given: current cover presence, the stored last trigger, the
  incoming trigger, and a force flag. The Nest planner and the Action selection both call it.
  This is the only new seam introduced.
- **Ownership of the trigger column moves to the capture side.** `last_capture_trigger` is
  written by the screenshot worker after a successful upload/write-back.
  `last_capture_dispatch_at` stays a Nest write and remains the cooldown input. The planner's
  cooldown branch is unchanged; only the idempotency comparison moves.
- **Dispatch result is part of the contract.** The executor inspects the dispatch outcome; a
  non-2xx result logs at error level with the HTTP status and records nothing.
- **Fast vs deferred action split.** The push and Vercel paths run the pipeline with the three
  LLM actions in the deferred set; the cron path runs with an empty deferred set and a
  per-run LLM cap of one. `DeferredActionSet` already exists for exactly this; no new
  mechanism, no new table, no schema change.
- **Advisory-lock scope shrinks.** The lock no longer wraps LLM/HTTP work inside an open
  transaction; it guards only the short critical section, so the transaction pooler is not held
  across network calls.
- **Lock loss is an outcome, not silence.** Every caller of the exclusive runner treats
  "did not acquire" as a reported, logged `skipped` result — matching what the manual
  pipeline-sync endpoint already does.
- **Per-action error isolation.** Each planned action runs independently; a failure is captured
  in the result and the remaining actions still run, with revalidate last.
- **Vercel dedupe happens after the pipeline resolves**, so a failed delivery stays retryable;
  the deduplication key remains the deployment id.
- **Backend column tolerance mirrors the frontend ladder.** Reads and writes that reference the
  new columns degrade to the pre-migration shape on an unknown-column error instead of
  throwing: curate's visibility sync, the draft insert, the pipeline state load, the screenshot
  worker's select, and the admin projects query.
- **Curate's visibility write is batched, not one statement per repo per pass**, and only for
  repos that map to an existing row.
- **`syncLiveUrl` acts on the planned project only**, not a bulk pass.
- **Refresh cron cadence returns to hourly.** Relaxing it becomes a follow-up gated on observed
  production webhook success.
- **Migrations 0032 and 0033 stay unapplied** and are a separate, explicitly-authorized action
  per the `CLAUDE.md` production-write gate. This PRD's changes must be correct both before and
  after they land.
- **Out of the epic's diff:** the unwired `github-cover*` module and the orphaned
  missing-README negative-cache spec (belongs to #177) are removed from this branch.

## Testing Decisions

A good test here asserts observable behavior at a public boundary: what the DB ends up
containing, what the Action would select, what the HTTP handler answers, whether a dispatch was
attempted. It does not assert on internal call order or private state, and it must be able to
fail — the current S8 smoke passes while the feature is broken because it only exercises the
planner against a fake executor and never crosses the Nest↔Action boundary.

Modules under test, and the prior art each follows:

- **Shared capture predicate** — pure unit tests, both sides. Prior art:
  `test/project-automation-sync.spec.ts` and `lib/snapshot-cover.test.ts`.
- **Dispatch↔Action contract** — one test that walks the real sequence (plan → dispatch →
  worker selection) and asserts the worker still selects the project, which is the case that is
  red today. Prior art: `test/pipeline-orchestration.s8.spec.ts`, extended past the fake
  executor.
- **Dispatch failure handling** — inject a non-2xx `fetchImpl` and assert nothing was recorded
  and an error was logged. Prior art: `test/screenshot-dispatch.spec.ts`.
- **Fast/deferred split and the LLM cap** — assert which actions execute on the webhook path
  versus the cron path via the existing executor-fake seam. Prior art:
  `test/pipeline-sync.spec.ts`.
- **Lock loss, per-action isolation, Vercel retryability** — controller-level tests with fakes.
  Prior art: `test/pipeline-sync.controller.spec.ts`,
  `test/vercel-webhook.controller.spec.ts`, `test/github-webhook-pipeline.spec.ts`.
- **Pre-migration tolerance** — simulate an unknown-column error from the client and assert the
  degraded path still succeeds. Prior art: `lib/projects-repo.test.ts` and
  `lib/projects-select.ts`'s existing attempt ladder.
- **Visibility badge** — component tests already exist; add a Playwright case to
  `nextjs/e2e/` asserting the badge renders on a project surface with no console/hydration
  errors. Prior art: the existing per-page smoke cases.

## Out of Scope

- Applying migrations 0032/0033 to production (separate authorized action).
- Creating the org-scoped Actions PAT and the Vercel webhook secret (human/dashboard work).
- Relaxing the refresh cron below hourly (follow-up, gated on observed webhook success).
- Implementing #177 (missing-README negative cache) — its spec is merely removed from this
  branch, the issue stays open.
- Wiring or deleting the `github-cover*` module beyond removing it from this branch.
- Any change to auto-publish authorization semantics (ADR 0011 stands).
- Reworking the visibility badge's product placement.

## Further Notes

- The planner's `snapshotReadmeSha` is the *GitHub-side* README sha from the snapshot store and
  `readmeSha` is the project's recorded sha; the null-snapshot early return is correct, not a
  bug. Traced and confirmed — no change needed.
- The frontend's `PROJECT_SELECT_ATTEMPTS` ladder already tolerates `gh_private`; the 400s seen
  in the test logs are that ladder working as designed. It is the model for the backend
  tolerance above.
- `loadByGithub` uses `limit 1`, so a repo mapped to two project rows syncs only one. Noted as a
  known limitation rather than fixed here.
- The screenshot workflow's concurrency group is global, so per-slug dispatches serialize behind
  one another (each boots Chromium). Relevant to the ≤10 minute SLO if many projects deploy at
  once; not addressed here.
