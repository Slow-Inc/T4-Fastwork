# Codebase scrutiny — 2026-07-27

Date: 2026-07-27 · Scope: `nextjs/` + `nestjs/`, ~28k lines of source · Method: 15-agent scrutiny run
(7 finders over disjoint territories → one adversarial verifier per territory → synthesis)

**This document exists so the sweep is not repeated.** It is the durable record of what was found, what
was refuted, what was *not* looked at, and the order the work should land in. Re-running the sweep costs
~2.5M tokens and 35 minutes; reading this costs a few minutes.

## How to read it

- **43 findings raised, 39 survived, 4 refuted.** 25 CONFIRMED (the verifier traced the failure itself),
  14 PLAUSIBLE (the defect is real in the code but reachability or platform behaviour was not proven).
  Severity of survivors: 1 critical, 10 high, 16 medium, 12 low.
- Verification was **adversarial and defaulted to REFUTED**: each finder's claims went to a separate
  agent whose job was to kill them, with "unreachable in production", "already handled by a caller or a
  test", "deliberate design", and "no concrete failure" as the standing grounds. A survivor is therefore
  a claim that a hostile reader could not dismiss — not merely something an agent noticed.
- Every row keeps its `file:line`. Line numbers are as of `master` on 2026-07-27; they drift.

### 🔒 Six findings are deliberately absent from this file

Three of them are reachable on production **right now** and this repository is public. Publishing the
surface names or the exploit path before the fix lands would hand out the map. They are recorded in
`docs/security-private/2026-07-27-live-authz-findings.md`, which `.gitignore` excludes, and they are
tracked in GitHub under non-specific titles.

The two most serious were **verified directly against the production database** with a read-only policy
query and a read-only anonymous probe — they are not traced guesses. **Both end in a production DB
write, so they require branch verification and explicit per-action authorization.** Read that file
before touching anything under `contact/`, `admin/` uploads, storage buckets, the chat rate limit, or
JSON-LD.

### What this run could NOT tell you

**No agent ran `bun test`, `bun run build`, or `bun run e2e`.** All 39 survivors are static traces, so
this document makes **no claim about whether the tree is green**, and several proposed fixes must
*invert assertions that are currently pinned* (`nestjs/test/project-automation-sync.spec.ts:230`,
`nextjs/lib/revalidate-project.test.ts:39-43`, `nextjs/lib/faqs-repo.test.ts:61-64`,
`nestjs/test/github-generate-store.spec.ts:114-122`). Nobody checked whether *other* specs pin the same
behaviour. The coverage record at the end of this document lists the gaps in full — read it before
assuming a subsystem is clean.

## Context that decides "bug" from "design" — three things a future reader will get wrong

1. **The missing-column fallback ladders are not defects.** `supabase/migrations/0032`, `0033`, `0034`
   are merged and **unapplied on production**, so the tolerance code (`missing-column.ts`,
   `PROJECT_SELECT_ATTEMPTS`, the `gh_private` / `last_capture_trigger` / `last_synced_at` try-catches)
   is a tracked mitigation (#198, #205, #221). **Do not refactor them while those migrations are
   unapplied** — that trades a known shape for an unknown one.
2. **The backend pooler is the Postgres superuser and bypasses RLS by design** (ADR 0007). "A backend
   write is not RLS-checked" is not a finding. The frontend's three clients are RLS-subject; that is
   where authorization findings live.
3. **The production backend entrypoint is `nestjs/api/index.ts`, not `src/main.ts`.** Anything
   configured only in `main.ts` does not exist in production. That is a live defect class, and one
   survivor below is exactly it.

## Findings — CONFIRMED

The verifier traced the failure itself and can state the failing input.

| Sev | file:line | Defect | Failure | Fix |
|---|---|---|---|---|
| high | `nestjs/src/github/pipeline-action-executor.service.ts:194` | `rank` and `revalidate` start with bare `void` and return on the same tick; `revalidate` is last in `ACTION_ORDER` | Deterministic half: the `/api/revalidate` POST always goes out *before* `rankService.refresh('projects')` calls `applyRanks`, and nothing revalidates afterwards (`rank.service.ts:39-47` does not) — a new rank order is invisible until an unrelated bust. `rank.controller.ts:32-34` does it the right way round, so the pipeline contradicts its own sibling | M |
| high | `nestjs/src/github/pg-generate.store.ts:143` | `taxonomySlug` collapses every all-non-ASCII name to `'item'`; INSERT keyed on `slug`, SELECT on `lower(name) OR slug` | Second distinct Thai category resolves to the first Thai category's id → a mobile-app project files under `เว็บแอปพลิเคชัน` and the facet filter returns the wrong project. Seeded `เว็บแอปพลิเคชัน` has slug `web-app`, so a duplicate row is created first and `limit 1` with no ORDER BY makes the id nondeterministic | M |
| high | `nextjs/components/chat/chat-client.tsx:296` | An unmounted instance's stream loop keeps calling `persistDirect([...base, next])` from a `base` captured at `:211`; `applyPersist` replaces `messages` wholesale (`lib/chat-conversations.ts:163-166`) with no version or prefix check | A→B→A mid-stream: the remounted pane is idle so the composer is live; a turn sent there is erased by the old loop's next token. While both loops are alive the store flips per token, and the surviving array is whichever emitted last | M |
| high | `nextjs/components/chat/chat-app-shell.tsx:173` | `key={state.activeId}` remounts ChatClient, which reads `initialMessages` only in the `useState` initializer (`chat-client.tsx:129-137`) and starts at `status:"idle"` | Reply freezes mid-word with no typing cursor and a live "สร้างใหม่" button; tokens keep landing in storage. A reload shows the complete answer. Same on popup close/reopen (`chat-button.tsx:111-132`) | M |
| high | `nextjs/components/chat/chat-app-shell.tsx:53` | `migrateFloating` is one-shot (`lib/chat-conversations.ts:284-305` returns early on `migratedFloating`, set even when nothing migrated) and the sessionStorage mirror is one-directional (`:119-124`) | Second popup message after the first `/chat` visit never reaches the store; the next `/chat` persist writes the shorter array over `floating`, destroying it in both stores | M |
| medium | `nestjs/src/github/pipeline-action-executor.service.ts:169` | A failed screenshot dispatch is logged and `return`s, so `executed` gains `recapture_cover` and the `catch` at `pipeline-sync.ts:173` is unreachable | With `SCREENSHOT_DISPATCH_TOKEN` parked (`docs/OPEN-WORK-LEDGER.md:326,338`) the `no-token` branch fires on **every** production push today — `executed` has contained a lie since a7f8910. Neither detector can see it: `summarizeSyncFailures([])` → null, and `IncompleteField` (`project-completeness.ts:18`) has no cover field. Note: an error log *does* fire, and the 6-hourly scheduled Action still gap-fills covers | S |
| medium | `nestjs/src/github/github-webhook.service.ts:56` | `seenBefore(deliveryId)` is an INSERT…ON CONFLICT — the claim *is* the check — and `DeliveryDedup` (`:9-12`) exposes no `forget`, so a throw after the claim cannot release it | GitHub 403/5xx (or a hung socket burning `maxDuration`, no `AbortSignal` in `github.service.ts`) → 500 with the marker committed. Operator clicks Redeliver → same GUID → `200 {action:'duplicate'}`: a success-shaped answer for work that never ran. Content converges via the hourly drains; what is lost is that delivery's `recapture_cover` and ISR bust. `vercel-webhook.controller.ts:190-207` does exactly the opposite and cites #200 | S |
| medium | `nestjs/src/github/vercel-webhook.controller.ts:195` | `runExclusive`'s `{ran:false}` is discarded and the reply is unconditionally `202 pipeline:…` with the dedupe key still claimed; same hole at `github-webhook.service.ts:66` for `runPush` | Two deploys/pushes for one repo overlap on lock `github-pipeline:<owner>/<repo>` → the loser is a permanent dropped event dressed as success. `pipeline-sync.controller.ts:84-94` branches correctly, so the codebase disagrees with itself | S |
| medium | `nestjs/src/github/project-automation-sync.ts:136` | `shouldRecaptureCover` never reads `state.liveUrl`; the worker requires it (`nextjs/lib/snapshot-cover.ts:64-67`, and `scripts/screenshot-projects.ts:137` `.not('live_url','is',null)`) | A repo with **no** GitHub homepage: `planLiveUrlFills` bails (`live-url-fill.ts:67`), live_url stays null forever, yet every push dispatches a full Chromium workflow run that captures nothing — and a third dispatch cancels the pending one that would have. `capture-eligibility.ts:5-8` claims the two sides share one rule. Latent while the dispatch token is parked. The `status` half is a non-issue (`auto_publish` precedes it in `ACTION_ORDER`) | M |
| medium | `nestjs/src/github/pg-generate.store.ts:93` | Tag/technology rows INSERT keyed on `taxonomySlug`, M2M links join on `lower(t.name)` (`:161-169`, `:177-186`) — two different keys | Once one name owns a slug, colliding names are never created and never linked, while the unconditional DELETE already ran → net loss reported as `generated: 1`. Pure-ASCII trigger: `C`/`C++`/`C#` all → `'c'`; `Next.js`/`Next JS` → `next-js`. Already observed in production: seed `{name:'Next.js', slug:'nextjs'}` vs `taxonomySlug`'s `next-js` created the duplicate rows faebee4/#184 had to paper over in the UI | M |
| medium | `nestjs/src/github/pg-generate.store.ts:80` | ADR 0011 keeps "validate `category` against the existing taxonomy" as a *code* guard; the code instead `insert into public.categories` from free-text LLM output | A hallucinated category becomes a permanent global facet chip on `/projects` (`content/catalog.ts:86` derives facets from the list), with no approval step by design and no removal path. ADR 0013:16 records the guard as present. Deliberate at the #159 level → resolution is a decision: fix the code or write an ADR reversing 0011 | M |
| medium | `nextjs/lib/revalidate.ts:49` | `ContentRevalidationKind` has no `member` kind and nothing else targets `/about`; `/about` is prerendered `revalidate: false` (`.next/prerender-manifest.json`) while rendering the DB roster | A skills edit shows on `/` within 600s and on `/team/<slug>` within 300s but never on `/about` — the same roster disagrees with itself indefinitely. The write is a browser-client update + `router.refresh()` (`profile-form.tsx:41-53`), which touches no server cache. Only a certificates CMS write ever busts `/about` | S |
| medium | `nextjs/lib/site-stats.ts:30` | Per-query `error` is never read; the fallback guard is `projects === 0 && certs === 0` | `member_projects` count fails while `team_projects` returns 12 → hero renders "12+ Projects", below even the hard-coded fallback of 21, for up to 600s per occurrence, nothing logged | S |
| medium | `nextjs/app/admin/(dash)/projects/actions.ts:252` | No admin action revalidates `/projects/[slug]`; `revalidateProjectFromAction` targets only `/admin/projects` + `/projects` and busts a tag the detail read never uses | For a CMS-created (non-GitHub) project, the deleted/unpublished/edited detail page keeps serving HTTP 200 with the full case study until a deploy. GitHub-backed rows self-heal in ~60s via `getRepoDetail`'s `next:{revalidate:60}` (`lib/github.ts:135-138`), which is why this hid | S |
| medium | `nextjs/app/admin/(dash)/projects/actions.ts:79` | Because the CMS ignores `status`, `status='hidden'` + `published_at != null` is a reachable steady state (`lib/member-showcase-sync.ts:144`) | `/admin/projects` shows the hidden row as เผยแพร่ (`page.tsx:93` reads `published_at` only, select never fetches `status`), the edit form pre-ticks the box (`edit-form.tsx:53`), and saving is a no-op — the publish control is dead for exactly those rows. Only re-ticking the member selection recovers it | S |
| low | `nestjs/src/github/vercel-webhook.controller.ts:165` | The `forget`-on-failure `try` starts at `:193`, but the claim is taken at `:160` and `mapper.resolve` (a pooler query, `pg-vercel-project.mapper.ts:52-63`) runs at `:165` outside it | A pooler blip during mapping loses that deployment permanently, for the exact reason the comment at `:190-192` says must not happen; the `warn` at `:173` cannot fire because mapping threw rather than returning null. Narrowest instance of the class — rank below the webhook one | S |
| low | `nestjs/src/revalidate/revalidate.ts:39` | `await fetchImpl(...)` then `return true` — the Response is never bound, so 401/404/500 all report success; doc comment at `:28-29` claims otherwise | Rotate `GITHUB_REFRESH_SECRET` in one Vercel project only → every revalidation 401s and nothing anywhere logs it. All eleven call sites discard the boolean with `void`, so the entire consequence is unfindability, not behaviour | S |
| low | `nextjs/lib/faqs-repo.ts:39` | `if (error \|\| !data \|\| data.length === 0) return staticFaqs` — a successful empty result is treated as a DB failure | Delete the last FAQ → `/faq` shows 15 hard-coded questions the admin cannot see, edit, or remove. Same at `services-repo.ts:42`, `certificates-repo.ts:25`, `blog-repo.ts:80`. The sibling states the opposite rule explicitly (`member-content-repo.ts:43-45`). The *error* branch is the documented DB-first design, not a defect | S |
| low | `nextjs/app/admin/(dash)/taxonomy/actions.ts:56` | `deleteTerm` discards the Supabase error and revalidates anyway; the action returns `void` so there is no channel | Deleting an in-use category raises 23503 (`projects_category_id_categories_id_fk` ON DELETE no action, `nestjs/drizzle/0000:110`) → dead button, no message, admin clicks again. Only the categories case is reachable — every other FK to `projects` cascades or nulls | S |

## Findings — PLAUSIBLE

The defect is real in the code, but reachability or platform behaviour was not proven. Treat the
"Missing proof" column as the work a fix must do first.

| Sev | file:line | Defect | Missing proof | Fix |
|---|---|---|---|---|
| high | `nestjs/src/database/seed.ts:19` | `bun run db:seed` / `db:seed:members` unconditionally DELETE nine content tables / all members with no env guard; `members` cascades to `member_certificates` + `member_projects` (`schema/member-content.ts:23,40`) | Needs an operator running the documented command against a prod `DATABASE_URL`. Sharper than "missing env check": the header claims "seeds the real portfolio content" and "idempotent" while `seed-data.ts` now holds ~8 dropped mockups vs the ~47 synced rows | S |
| medium | `nestjs/src/github/taxonomy-generate.ts:116` | `validateTechnologies` is called with `languages: {}`, degrading to a README substring test that can return `[]`; `reconcile` forwards `[]`, and `applyPatch` DELETEs on `!== undefined` but INSERTs on `.length` (`pg-generate.store.ts:171-186`) | The wipe is deterministic, but reaching a row that is a `listPublishedNeedingTaxonomy` candidate *and* already has tech links needs a prior run whose category failed to resolve. Violates ADR 0011's "never replace good published copy with a failed run" | S |
| medium | `nestjs/src/rank/rank.controller.ts:35` | `void revalidateProjects()` / `void this.rag.reingest().catch(()=>{})` after the response; no `waitUntil`, `@vercel/functions` not a dependency | Platform freeze timing not measured. Extra consequence: a frozen `reingest()` never runs its `finally` (`rag-ingest.service.ts:35-37`), so `running` stays true and every later re-ingest on that warm instance returns `{ingested:false}` | S |
| medium | `nextjs/lib/projects-repo.ts:150` | Ladder-exhausted, thrown driver error, and genuine zero-row all become `undefined` → `notFound()`, and the notFound path runs no `fetch` so the 404 stores with `INFINITE_CACHE` (`app-render.js:4307`) | Could not prove Vercel's ISR layer persists a 404 for an on-demand param. Bounded to ~1h anyway: the hourly cron's `revalidateProjects()` → `revalidatePath('/projects/[slug]','page')` invalidates cached 404s via the implicit tag. The sibling list read was hardened for exactly this (#234, `:84-99`) | S |
| medium | `nextjs/lib/org-repo-import.ts:68` | `narrowOrgRepo` (`:113-132`) never reads `r.private`, and `orgRepoToProjectInsert` hardcodes `status:'published'` + `published_at` | Same latency: needs a private repo visible to the PAT plus an admin click. The picker (`from-org/page.tsx:70-98`) shows no visibility column, and the insert never sets `gh_private`, so even post-0033 the row would render no badge. `github-curate.ts:82` is the only private gate in the codebase | S |
| low | `nextjs/lib/revalidate-project.ts:32` | Action path omits the `/projects/[slug]` target its route-handler twin includes (`lib/revalidate.ts:74`) | Subsumed by the CONFIRMED row above; residual is only "no read-your-own-writes on the public detail page" | S |
| low | `nestjs/src/chat/system-prompt.ts:49` | Prompt renders `[FAQ:<id>]` but `FULL_MARKER` matches `PROJECT\|SERVICE` only (`marker-parser.ts:17-18`) and `CardRef` has no faq variant | Whether the model emits the marker is model behaviour; `:96` names only PROJECT/SERVICE as citable. Worst case a stray `[FAQ:12]` in one sentence | S |
| low | `nestjs/src/chat/chat.controller.ts:16` | `ChatRequestDto` undecorated, no `ValidationPipe`, `class-validator` not a dependency | `{"message":null}` yields a Thai "service unavailable" + HTTP 200 after two paid round trips — but only to whoever crafted it. Upstream 400 behaviour inferred, not executed. `images` *is* defended (`image-guard.ts`), which is the asymmetry | M |
| low | `nestjs/src/ingestion/rag-ingest.service.ts:19` | In-process `running` boolean advertised as "Single-flight"; the caller holds a durable `runExclusive` lock for `refreshAll` and fires `reingest()` outside it | No path exists for two to overlap: one caller, hourly cron under a GH concurrency group. Duplicate embedding sets self-heal on the next single run | M |
| low | `nextjs/lib/server.ts:25` | `setAll` swallows on the documented assumption that middleware refreshes sessions; no `middleware.ts`/`proxy.ts` exists and `lib/middleware.ts` is imported by nobody and redirects to a nonexistent `/auth/login` | Supabase reuse-interval behaviour is auth config not in the repo. Bounded: any admin Server Action refreshes successfully; only pure read-only browsing is exposed | S |
| low | `nextjs/lib/member-repo-import.ts:84` | De-dupes member repos by slug alone; owner is available and unused (`org-repo-import.ts:93-96` does check identity) | Needs two members with identically-named repos. **Wrong location**: the live path is `nestjs/src/github/github-curate.ts:206` (`existsBySlug`, no owner check at all), where the collision is skipped on every hourly run and the admin UI never sees it | M |
| low | `nestjs/src/github/pg-generate.store.ts:115` | `readme_sha = ${patch.readmeSha ?? null}` turns "not supplied" into "erase"; no DTO on the body | Refuted for the automated path — `ContentGenerateService` is constructed only on the dry-run branch (`github-generate.controller.ts:78-87`) with a capture stub. Survives only as an operator-only `apply:true` footgun with no demonstrated caller | S |
| low | `nextjs/components/projects/project-card.tsx:56` | Un-deduped `p.tags` with `key={t}`; the mapper (`lib/project-map.ts:65-67`) has no `Set`, unlike `project-technology-panel.tsx:61` and `content/catalog.ts:81` | Duplicate *tag* names unproven (duplicate *technology* names are proven, but the card renders neither). The E2E argument in the original finding is wrong — React's duplicate-key warning is dev-only | S |

**Demoted by the synthesizer:** `readme_sha` erasure, the RAG single-flight boolean, project-card
keys, and `lib/server.ts`'s swallowed `setAll` are real code inconsistencies with no demonstrated
user- or operator-visible failure. Do not spend a PR each.

## Remediation plan

**This plan is not a substitute for issues.** Per `CLAUDE.md`, each item below becomes **one tracked
GitHub issue** before its code is written, lands through **one issue-linked PR**, and takes the full
pre-merge gate (`code-review` + `scrutinize` on `git diff origin/master...HEAD`, bilingual evidence
quoting the reviewed HEAD SHA) regardless of size. Items are sized to be landable in a single PR.

Five items (**A, B, C, K, O**) are on the **private track** — their bodies live in
`docs/security-private/2026-07-27-live-authz-findings.md` and their issues carry non-specific titles.
Only their sequencing appears here.

### Wave 0 — decisions that block work (developer's, not the agent's)

| # | Decision | Why it cannot be guessed |
|---|---|---|
| 0.1 | **Grants (item A)**: agent prepares a migration + verifies on a Supabase branch, or the developer applies it in the dashboard | It ends in a production DB write; a merge or deploy approval is explicitly not that authorization |
| 0.2 | **Item I**: make the code match ADR 0011's validation guard, **or** write a new ADR reversing 0011 | ADR 0011 records a guard the code does not implement. If auto-creating taxonomy from LLM output is wanted, the deliverable is an ADR, not a patch — and reversing an ADR is never an edit |
| 0.3 | **Turnstile on chat (part of K)**: land the widget + token, or drop the claim | Enabling the guard today would 401 every chat request. Half-landing it is worse than either end state |

### Wave 1 — close what is exploitable without touching the database

**B** (private track) then **C** (private track). Both are app-layer, both are small, and neither needs
authorization for anything. This wave removes the only `critical` in the inventory.

A CSP is **not** in this wave: `nextjs/next.config.ts` has no `headers()` at all, and adding one can
break inline styles and third-party embeds. File it separately as defence-in-depth after B.

### Wave 2 — the live authorization objects

**A** (private track). Blocked on decision 0.1. Keep every statement additive and idempotent; note that
a `revoke` is **not** additive and needs its own explicitly-authorized step — the classifier in
`nestjs/src/github/additive-migration.ts` refuses it, correctly.

Also in scope: both objects exist **only on production**, in no migration. Part of the deliverable is
that a Supabase branch or a rebuilt database ends up with the same schema and the same policies.

### Wave 3 — chat: land the harness, then the two bugs

| Item | Closes | Note |
|---|---|---|
| **D-harness** | — | A Playwright fixture that fulfils `**/chat/stream` **in chunks**. Every current case fulfils the whole SSE body at once (`nextjs/e2e/site.e2e.ts:806-816`), which is exactly why these two bugs were never caught. Land this first; it unblocks D and D2 |
| **D** | `chat-client.tsx:296`, `chat-app-shell.tsx:173` | Reject a stale stream persist and keep the transcript live across a conversation switch. **This is issue #36**, open longest of anything in the tracker |
| **D2** | `chat-app-shell.tsx:53` | Reconcile the popup transcript on every shell mount; `migrateFloating` is one-shot and the sessionStorage mirror is one-directional |

Gates: `bun run e2e` is mandatory for all three — the value of D-harness *is* the browser coverage.

### Wave 4 — stop the pipeline reporting work it did not do

Order matters; F and G touch different methods of the same file and E touches a third.

| Item | Closes | Note |
|---|---|---|
| **F** | `github-webhook.service.ts:56`, `vercel-webhook.controller.ts:195`, `:165` | Release the dedupe claim when the run fails or is skipped. Introduce `withClaim(key, fn)` here — see refactor 2 |
| **G** | `pipeline-action-executor.service.ts:169` | A rejected screenshot dispatch must report as a **failed** action. Distinguish `no-token` (dev no-op → its own `deferred` outcome) from an API rejection, or every local run reports a permanent failure |
| **E** | `pipeline-action-executor.service.ts:194`, `rank.controller.ts:35`, `revalidate.ts:39` | Await the revalidation the pipeline claims it executed. **Do not simply `await` rank inline** — it is an LLM call inside `maxDuration: 60` and is deliberately excluded from `WEBHOOK_DEFERRED_ACTIONS`; move it to the cron drain or bound it |

Together these three are why the ≤10-minute freshness target in
`docs/prd/2026-07-24-event-driven-realtime-showcase-sync.md` currently has no honest signal behind it.

### Wave 5 — taxonomy identity

| Item | Closes | Note |
|---|---|---|
| **H** | `pg-generate.store.ts:143`, `:93` | Key taxonomy rows by name, not by a collapsing slug. Riders: mapper-level dedupe in `lib/project-map.ts:65-68`, and the owner-less `existsBySlug` at `github-curate.ts:206`. Existing seeded duplicates need a **separate, authorized** one-off cleanup — not in this PR |
| **I** | `pg-generate.store.ts:80`, `taxonomy-generate.ts:116` | Blocked on decision 0.2 |
| **J** | `project-automation-sync.ts:136` | Gate cover recapture on a resolvable `live_url` **at dispatch time**, not in the planner. `test/project-automation-sync.spec.ts:230` currently asserts the wrong behaviour — invert it |

### Wave 6 — correctness and hardening

| Item | Closes | Note |
|---|---|---|
| **M** | `faqs-repo.ts:39` (+ services / certificates / blog), `site-stats.ts:30`, `projects-repo.ts:150` | Stop treating a failed read as an empty result. `faqs-repo.test.ts:61-64` pins the defect — invert it. See refactor 4 |
| **N** | `revalidate.ts:49`, `actions.ts:252`, `revalidate-project.ts:32` | Revalidate the routes the admin writers actually change; move the two browser-client writes in `profile-form.tsx` / `certificate-manager.tsx` behind a Server Action |
| **K** | private track | Blocked on decision 0.3 for the Turnstile half; the rate-limit half can land alone |
| **L** | `seed.ts:19`, `seed-members.ts:174`, `seed-member-content.ts:277` | Refuse destructive seeds outside a local database, and correct the header that claims "idempotent" |
| **O** | private track | Filter on the serving path only |
| **P** | `taxonomy/actions.ts:56` | Surface `deleteTerm`'s 23503 instead of revalidating over it. Scope to `deleteTerm` — the sibling deletes' swallow is inert |

### Explicitly not worth doing

- **Do not** consolidate the four `postgres()` pools — that finding was refuted: `max` is a lazy ceiling
  and `max_lifetime` defaults to 30–60 min.
- **Do not** refactor the missing-column fallback ladders while `0032`/`0033`/`0034` are unapplied.
- **Do not** open `chat-client.tsx` for its line count. 763 lines is not a reason; the two survivors
  pointing at its stream ownership are (refactor 3).
- Four rows were demoted by the synthesizer as real code inconsistencies with **no** demonstrated
  user-visible failure — `readme_sha` erasure, the RAG single-flight boolean, project-card keys, and
  `lib/server.ts`'s swallowed `setAll`. Fold them in as riders or close them as "documented, not fixed";
  do not spend a PR each.

## Structural refactors — each named by two or more survivors

Four, each named by two or more survivors. Nothing else.

**1. Taxonomy identity is a slug function, and there are two of them.** Structural cause: `taxonomySlug` (`nestjs/src/github/taxonomy-ensure.ts:5-12`) is used as the *write* key while `lower(name)` is the *read/join* key (`pg-generate.store.ts:139-146`, `:161-186`), and the frontend has a second, incompatible slugifier (`nextjs/app/admin/(dash)/taxonomy/actions.ts:15-22`). This structure produced the wrong-category assignment, the silent tag/tech drop, the duplicate `Next.js` rows that commit faebee4 papered over in the UI (#184), the owner-less `existsBySlug` collision at `github-curate.ts:206`, and the un-deduped card keys. Seam: one `resolveTaxonomyTerm(name)` that owns identity — name-keyed lookup, insert only when absent, collision-free slug (transliterate or `<base>-<hash8>`) — imported by both workspaces. Every one of those five findings then has one place to be wrong.

**2. The claim/lock envelope is hand-rolled per entrypoint.** Cause: each webhook independently does claim → work → reply, and each gets a different subset right — `vercel-webhook.controller.ts:190-207` releases on throw but not on `{ran:false}` and not for `mapper.resolve`; `github-webhook.service.ts` cannot release at all because `DeliveryDedup` (`:9-12`) omits `forget`; `pipeline-sync.controller.ts:84-94` is the only caller that narrows the outcome. Four survivors, one shape. Seam: `withClaim(key, fn)` that owns claim-release-on-any-non-success, plus a `PipelineOutcome` union the controllers must exhaustively narrow so `{ran:false}` cannot be assigned to nothing. Land it inside item F of the plan above.

**3. Chat stream ownership — this is where `chat-client.tsx`'s 763 lines actually matter.** Cause: `chat-app-shell.tsx:173` remounts on `key={activeId}` while the stream loop lives *inside* the unmounted instance and keeps writing storage from a `base` captured by value (`chat-client.tsx:211`, `:287-298`). Two survivors point straight at it and a third (`migrateFloating`'s one-shot) exists because storage is the only channel between the two surfaces. Seam: hoist the stream loop into the shell so one owner holds `messages` + `status` per conversation and ChatClient becomes a controlled pane. That single move retires the stale-write, the frozen transcript, and the need for a bidirectional storage reconcile. It is also the only reason to reopen that file — line count alone is not.

**4. Error-vs-empty is decided independently in every repo module.** Cause: each of `faqs-repo.ts:39`, `services-repo.ts:42`, `certificates-repo.ts:25`, `blog-repo.ts:80`, `site-stats.ts:25-37`, `projects-repo.ts:150` re-implements the fallback decision, and they disagree — `member-content-repo.ts:43-45` states the correct rule in a comment nobody else follows, and `projects-repo.ts:84-99` was hardened for exactly this class (#234) while its sibling read was not. Seam: one `readOrFallback(result, fallback)` that branches on `error` only and never on `length`, applied across the six. Small, and it stops the next reader from guessing.

**Explicitly not worth doing:** do not consolidate the four `postgres()` pools (the finding was refuted — `max` is a lazy ceiling and `max_lifetime` defaults to 30-60 min), and do **not** refactor the missing-column fallback ladders while `0032`/`0033`/`0034` are unapplied — they are tracked mitigations and touching them now trades a known shape for an unknown one.

## Coverage record — what was NOT looked at

**Never executed, by any finder.** Nobody ran `bun test`, `bun run build`, or `bun run e2e`. Every one of the 39 survivors is a static trace. Consequence: there is no statement about whether the tree is currently green, and several proposed fixes must invert pinned assertions — `test/project-automation-sync.spec.ts:230`, `lib/revalidate-project.test.ts:39-43`, `lib/faqs-repo.test.ts:61-64`, `test/github-generate-store.spec.ts:114-122` — and nobody checked whether *other* specs pin the same behaviour.

**Files named in a territory but not opened.** `nestjs/src/github/`: `github-case-study-client.ts`, `github-curate.controller.ts`, `github-curate-run.ts`, `pg-member-project-store.ts`, `og-image.ts` (declared dead on an importer grep alone). `nestjs/src/database/`: `seed-data.ts` (13 KB of fixtures — the very file issue L's staleness claim rests on), `seed-member-content.ts` beyond its delete block, and `schema/{content,github,members,showcase,chat}.ts` read only by targeted grep. `nextjs/lib/`: ~57 of ~107 files, including `stagger`, `first-visit`, `seo`, `utils`, `slugify`, `team-slug`, `tech-logos`, `cta-click`, `chat-relative-time`, `chat-persist`, `project-chat`, `markdown.tsx`. `nextjs/components/site/`: `sdlc-list`, `sdlc-section`, `process-schematic`, `tech-stack`, `team-section`, `team-tech-section`, and `hero-scene`'s siblings.

**Subsystems nobody was assigned.** The `/lab`, `/lab3`, `/lab4` prototype routes — zero coverage, and they carry the heaviest client-side code in the repo (GLB loading, scroll drivers, shaders). `nextjs/scripts/` (only `screenshot-projects.ts`, only where the capture contract crossed it). `.github/workflows/` beyond `screenshot-projects.yml` and `github-refresh-cron.yml` — no audit of the other workflows, their secrets, or their concurrency groups. `supabase/migrations/` was read selectively (0002, 0012, 0016, 0018, 0020, 0021, 0023, 0032-0034); `nestjs/drizzle/` only 0000 and 0002 — **there was no systematic migration-vs-production drift audit**, and `leads` proves that class of gap is real and load-bearing. Of 16 ADRs, only 0002, 0007, 0008, 0009, 0011, 0013 and 0014 were consulted; nine were never checked for code that contradicts them — and the two ADR-violation findings (I) were found incidentally, not by design. `Requirement.MD` / `requirement2.md` / `requirement3.md` were never diffed against the implementation, so "the spec asks for X and the code does Y" is an entire unexplored claim class.

**Claim classes this run's design could not reach.**
- *Live database.* Only the security finder queried production. That single decision produced three of the top findings (the `leads` policy, the `media` policies, and the refutation of the `/github/team` disclosure). Everything else DB-dependent is inference: whether a cached 404 actually persists on Vercel ISR (M), whether `/about`'s frozen roster is observable (N), the row state behind the empty-technologies wipe (I), whether duplicate *tag* names exist today, and how many rows a taxonomy-collision cleanup would touch.
- *Real browser.* No hydration, layout, paint, or interaction was observed. The entire class of bug the repo's own E2E note exists for (the navbar overlap) is uncovered. All four chat findings are static, and the harness they need — chunked SSE plus mid-stream navigation — does not exist in `e2e/`.
- *Production traffic and logs.* Unmeasured: how often the Vercel freeze truncates a trailing promise (E), what `req.ip` actually resolves to behind the Vercel Node bridge (K — inferred from Express `trust proxy` semantics, never observed), whether the screenshot-dispatch error log is firing right now, and whether a Cloudflare rate-limit rule fronts the API host at all.
- *External configuration.* `GITHUB_TOKEN`'s scope was never verified — O's blast radius depends entirely on it. The org webhook's event subscription is invisible from the checkout, which is why the `X-GitHub-Event` claim could only be refuted for the `ping` case. Supabase auth settings (email confirmation, refresh-token reuse interval) are not in the repo, which capped two findings at PLAUSIBLE.
- *Not attempted at all.* Accessibility, bundle size, Core Web Vitals, TH/EN copy parity (`title_en`, `role_en`, `name_en`, the locale context) — nobody checked that both language paths exist on the surfaces they touched.

**What the next pass should target, in order.** (1) A live authorization sweep: enumerate every table and storage bucket in production, diff against `supabase/migrations/`, and list every object with no committed definition — two of the three worst findings came from exactly this and only one of seven finders did it. (2) Build the chunked-SSE + mid-stream-navigation E2E harness, then re-run the four chat claims against a real browser. (3) The migration-drift audit as a standing test, not a one-off. (4) The `/lab*` routes and `nextjs/scripts/`, which no finder opened. (5) An ADR-vs-code conformance sweep across all 16. (6) Requirement-vs-implementation, starting with `Requirement.MD` §7 and the sections behind the shipped member CMS.