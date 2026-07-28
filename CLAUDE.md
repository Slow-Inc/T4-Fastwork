# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Operating defaults (mandatory)

**Invoke the `using-t4` and `karpathy-guidelines` skills by default at the start of every coding
task in this repo — before writing or changing code, not after.**

- **`using-t4`** routes the task through the T4 operating standard (memory/ledger →
  issue → PRD → issues → TDD → records → bilingual tracker → PR). It is the map; follow it
  rather than working from memory of it. (Session start: also read `docs/OPEN-WORK-LEDGER.md`
  + [`Obsidian-Fastwork/Home.md`](Obsidian-Fastwork/Home.md) + the relevant domain memory before
  picking up work.)
- 🛑 **The delivery pipeline is a HARD GATE — spelled out here so it is not missed; do NOT rely on
  the `t4-dev-workflow` skill alone (it has been skipped too often).** Any non-trivial change flows:
  **`grill-me` (stress-test the idea) → `to-prd` (one PRD per epic) → `to-issues` (one tracked GitHub
  issue per deliverable) → `tdd` (red-first) → PR that references its issue.**
  - **No code lands without a tracked GitHub issue; no PR without a referenced issue.** Nothing checks
    this for you — see **Enforcement status** below before assuming any part of the pipeline is
    automatic.
  - **A plan, roadmap, or ticket list in a `docs/` file is NOT a substitute for real GitHub issues.**
    Convert each deliverable into an issue **before** implementing it — including when you work from a
    fix-plan doc or hand tickets to another agent. Retro-fitting an issue at PR time to satisfy the hook
    is the tell that this gate was skipped.
  - Issue/PRD/PR bodies are **bilingual** (English + a full Thai mirror). Every deliverable maps to
    exactly one issue you are allowed to work; close issues with stated evidence, never silently.
- **`karpathy-guidelines`** enforces: think before coding (state assumptions, surface
  tradeoffs, don't pick silently), simplicity first, surgical changes, goal-driven execution
  with verification.
- 🔍 **Survey the whole surface first — the plan is written *from* the survey, never from memory of the
  code.** A complete survey means: **every** call site, not the one you expected (grep the symbol and
  read the list); **both** workspaces for any claim about the monorepo; the **prior art** in a sibling
  repo, whose comments carry its scars; and a **verified** capability — a permission, a flag, how a tool
  behaves under a different shell or from a child process — never an assumed one. Then **state what the
  survey did not cover**, so a gap is a recorded limit instead of a later surprise.
  - Measured cost of skipping it, all on 2026-07-28: a CI plan that would have left every docs-only PR
    permanently unmergeable (only `Slow-Inc/MangaDock`'s `ci.yml` said so); "the test job needs no
    environment" written into a commit after measuring one workspace of two; a guard checker that
    reported four healthy guards as missing because nobody checked how `gh` behaves in a child process;
    and "an agent cannot set branch protection" written into an issue by an agent whose token had
    `admin: true`.
  - **A surprise during implementation is usually a survey that stopped early, not bad luck.**
- **Shared engineering knowledge:** `Obsidian-Fastwork/` is the committed cross-agent knowledge
  base. At the start of every session, read `Obsidian-Fastwork/Home.md` first, then open only the
  linked notes relevant to the task. Do not load the whole vault blindly. Keep `Home.md` and the
  relevant index current whenever durable knowledge is added.
- **Learning capture is a completion gate:** after a wrong assumption, user correction,
  regression/rework, non-obvious failure, or reusable lesson, update the relevant vault note (or
  create and index one) before declaring the task complete. Record only validated causes.
- **Merged branches do not linger:** GitHub auto-delete is enabled. After a PR merges, verify the
  remote head is gone, prune remote refs, and safely delete the local branch after switching away.
  Never delete default/current/long-lived or unverified branches.
- Also standing: **TDD is mandatory** and **every frontend change is verified end-to-end**
  (`bun run e2e`) — see the ⚠️ note under Commands.
- 🛑 **STOP GATE — you are about to land a branch.** The trigger is the *action*: `gh pr merge`,
  enabling auto-merge, merging in the GitHub UI/API, or any other way a branch reaches the default
  branch. Before that action:
  1. Resolve the PR and its current HEAD SHA (read it — `git rev-parse HEAD` — never from memory).
  2. Run **`code-review`** and **`scrutinize`** on the **ACTUAL merge diff**:
     `git diff origin/master...HEAD` (three-dot; two-dot lies on a stale branch).
  3. Post the full **English + Thai** report as a PR comment, recording the reviewed HEAD SHA and the
     comment URL.
  4. If HEAD moved, both reviews are stale — rerun and post again.
  5. Only then merge.
  - **Applicability is decided by the attempted merge — never by what the change contains.** Not file
    type, not line count, not `Refs #N` vs `Closes #N`, not "it's only docs". **docs-only, ADR-only,
    ledger, config, test-only and one-line branches all take the full gate.** These are the exact
    proxies that were used to skip it four times in one session (2026-07-26); they are not inputs.
  - **If you find yourself reasoning that this change does not need the gate, that reasoning IS the
    failure mode.** The gate on a docs PR is not ceremony: the review skipped that day shipped an ADR
    whose load-bearing premise was never verified, and `scrutinize` step 1 is "is the premise real?".
- **Conditional gate, separate from the one above:** add **`security-review`** when the merge diff
  touches auth / RLS / admin-write / secret / upload / webhook / untrusted-input / external-request /
  privileged-client surfaces, and include its findings or residual risks in the same bilingual
  evidence. This list scopes `security-review` **only** — it does not narrow the STOP gate, which has
  no content-based scope at all.
- 🛑 **The default branch is merge-only.** Before the first change in a task, check the current branch;
  if it is `master`, branch first. **Every** change — code, docs, ADRs, ledger entries, one-liners —
  lands through an issue-linked PR that passed the gate above. Never `git push` a commit to `master`.
  Verify branch and destination before every push. (Learned 2026-07-26: a ledger commit went straight
  to `master` because this rule lived only in `Obsidian-Fastwork/Branch First Delivery.md`.)
- 🛑 **Any PRODUCTION DB write is a STOP-and-get-explicit-authz action — a separate, EARLIER
  checkpoint than the merge gate.** A migration, seed, or data change applied to the prod database
  via **any** path (Supabase MCP `execute_sql`, `supabase`/`psql` CLI, or the dashboard) requires:
  (1) verify on a Supabase branch or on localhost **first**; (2) **surface the exact write and WAIT
  for the user's explicit OK for THAT action**. "Take this over" / "keep going" / a merge-or-deploy
  approval is **NOT** authorization for a raw prod DB write — and applying something a prior step
  deliberately *parked* for the rules is overriding that guard, not completing it. Keep migrations
  additive + idempotent; **never hand-edit `supabase_migrations.schema_migrations`.** ⚠️ **No hook
  enforces this — and per Enforcement status below, none enforces anything else either** — so the
  guard must live here in the map, not only in an agent's private memory.

Skip only for trivial, non-code conversational replies. These override default behavior; the
user's explicit instructions still win.

### Enforcement status — verified against this checkout, 2026-07-27

**Documentation is never evidence that a hook exists.** If a row below claims machinery and you cannot
find the artifact it names, **the repository wins** — treat the control as discipline and say so.
A row that reads *discipline only* needs no artifact; that is the honest case, not a gap in the table.

<!-- enforcement-table:start -->

| Control | Status | Evidence |
|---|---|---|
| Issue referenced on PR creation | discipline only | no `PreToolUse` hook; no `.claude/t4.json` |
| `code-review` + `scrutinize` before merge | discipline only | nothing verifies the review evidence |
| Tests + type-check run on every PR | enforced by CI | `.github/workflows/ci.yml`, asserted by `nestjs/test/ci-workflow-is-wired.spec.ts` |
| Merge while CI is failing | blocked by a required check | the `gate` job in `.github/workflows/ci.yml`; evaluated by `nestjs/src/github/repo-guards.ts` |
| Force-push or delete the default branch | blocked server-side | branch protection; evaluated by `nestjs/src/github/repo-guards.ts` |
| Merge from a stale base | blocked server-side | branch protection `strict`; evaluated by `nestjs/src/github/repo-guards.ts` |
| Committing a detected secret | blocked server-side | secret-scanning push protection; evaluated by `nestjs/src/github/repo-guards.ts` |
| Dangerous-git refusal (`reset --hard`, `branch -D`) | discipline only | no command-denial hook |
| Production DB write stop | discipline only | stated in this file; no mechanism |
| Direct push to the default branch | discipline for admins | protection is on, but `enforce_admins` is deliberately off so a broken CI can still be fixed — see `nestjs/src/github/repo-guards.ts` |

<!-- enforcement-table:end -->

The server-side rows were verified by hand on **2026-07-28** — `required_status_checks.contexts = ["gate"]`,
`strict = true`, force-pushes and deletions off, secret scanning and push protection on — and proved to
actually block: a PR with a deliberately failing test reported `mergeStateStatus = BLOCKED` (#279).
Re-check with `bun run scripts/check-repo-guards.ts` **from an interactive shell**; spawned from a child
process, `gh` falls back to a token without admin rights and the script correctly answers *cannot verify*
rather than guessing. Automating it needs an admin-scoped token, which is a decision, not a task.

`.claude/settings.local.json` contains a `SessionStart` hook only. Any PR that adds or removes
enforcement **updates this table in the same PR** and names the checked-in path plus a command that
verifies it — not the word "enforced". A test holds the table to that:
`nestjs/test/enforcement-claims-are-backed.spec.ts`.

## Repository layout

Bun-workspaces monorepo (root `package.json` → `workspaces: ["nextjs","nestjs"]`). It contains:

- **`nextjs/`** — the Next.js frontend app (port 3000).
- **`nestjs/`** — the Nest.js backend API (port 4100): AI chat (RAG + streaming SSE), data layer. See the AI Chatbot Backend wayfinder map, [Slow-Inc/T4-Fastwork#1](https://github.com/Slow-Inc/T4-Fastwork/issues/1).
- **`docs/`** — agent config (`docs/agents/`) and design docs.
- **`Obsidian-Fastwork/`** — committed cross-agent engineering knowledge. `Home.md` is its Map of
  Content; only personal `.obsidian/` UI state is gitignored.

`bun install` at the root installs both workspaces (one root `bun.lock`).

## Product context

This is a **live** T4 Labs agency/portfolio website (Bigzweb-style): a project/portfolio
showcase with category+tech filtering + **AI display-ranking**, an AI chat assistant (RAG over
projects/services/FAQ), a bilingual (TH/EN) blog, an admin CMS, a **GitHub-sourced,
member-editable member CMS** (members log in with GitHub and edit their own profile / add
certificates + articles as drafts → admin approve), and lead-gen flows. See the ADRs
(`docs/adr/`) for the load-bearing decisions.

**Full requirements (Thai): `Requirement.MD` at the repo root — read the relevant section before implementing any page, component, or data model.**

### 🎯 North Star — minimal human control

**The site maintains itself.** GitHub is the source of truth, AI fills the gaps, and the admin does
**not** hand-maintain content. This is the goal every automation decision serves.

- **Visibility is authorization.** A public repo's visibility *is* the publish authorization — no
  human approval step for generated copy on a public repo (**ADR 0011**).
- **Measurable target** (`docs/prd/2026-07-24-event-driven-realtime-showcase-sync.md`): after a
  push/deploy, processing **starts ≤ 2 min** and the full sync (content + cover) is **visible
  ≤ 10 min**.
- **Corollary for agents — a step that requires a human is a defect to design out, not a normal
  part of the flow.** When you genuinely must park one (a production DB write, a token, a dashboard
  action), file it as an issue that states the path to automating it away, and say so in the
  handoff. Handing a human a recurring chore without that issue is an incomplete deliverable.
- This does **not** loosen anything in **Operating defaults (mandatory)** above — the delivery
  pipeline, the pre-merge review gate, and especially the 🛑 production-DB-write stop. Destructive
  or authorization-changing actions stay human-approved on purpose; the target is to make the
  *routine additive* work automatic.

Target stack per the spec (§7) — **now implemented**:

- Package manager/runtime: **Bun** (migrated — see Commands below)
- Frontend: Next.js App Router + TypeScript + Tailwind + client-side locale context for i18n (TH/EN)
- Backend: **Nest.js as a separate API layer** in `nestjs/` (decided — see the wayfinder map #1)
- Database: Supabase (Postgres + pgvector for RAG + Auth + Storage + Realtime); backend connects via the Supavisor transaction pooler (6543) with Drizzle
- AI: streaming LLM via an OpenAI-compatible gateway (`CUSTOM_OPENAI_*` env) + RAG via pgvector
- Deploy: **both apps run on Vercel — serverless, not a long-lived server** (see below)

### ⚠️ Deploy topology — we are serverless (do not assume otherwise)

**Hostinger (registrar) → Cloudflare (DNS + CDN/proxy) → Vercel.** There is no self-hosted option in
play; **`nextjs/` and `nestjs/` both run as Vercel serverless functions**, and the backend's real
entrypoint in production is **`nestjs/api/index.ts`**, *not* `src/main.ts` (that only runs for local
`bun run start`) — so all backend bootstrap config belongs in the shared `src/configure-app.ts`.

Three consequences that have each already cost a bug or a wrong plan:

- **Nothing persists in process memory.** A module-scope cache is per-instance and mostly unused; a
  `setInterval`/held loop or an in-process queue does not exist between requests. Measured: the memo in
  `createColumnLadder` (#207/#233) only took `/projects` 3.2–3.7 s → 1.4–1.6 s, never sub-second.
- **Per the vendored Next 16 docs, `'use cache'` *and* `'use cache: remote'` fall back to an in-memory
  LRU isolated to each process** unless `cacheHandlers` is configured — so "just cache it" is not a
  serverless answer. Only Vercel `PRERENDER` (`x-vercel-cache`) is measured genuinely fast here.
- **Cloudflare serves HTML as `cf-cache: DYNAMIC` on purpose.** Turning on "Cache Everything" for HTML
  is a **no-go** — it fights the ISR / on-demand revalidation path, trading the freshness guarantee for
  latency, silently.

Details + measurements: [`Obsidian-Fastwork/Three Cache Layers on Serverless.md`](Obsidian-Fastwork/Three%20Cache%20Layers%20on%20Serverless.md).

Phased roadmap: **Phase 1** MVP (portfolio + CMS) → **Phase 2** AI chat + RAG + blog → **Phase 3** full i18n, analytics, performance polish.

## ⚠️ Non-standard Next.js version

`nextjs/` pins `next@16.2.10` — a version newer than your training data, with breaking changes to APIs, conventions, and file structure. **Before writing or modifying any Next.js code, read the relevant guide under `nextjs/node_modules/next/dist/docs/`** (organized as `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`) rather than relying on prior knowledge of Next.js. Heed any deprecation notices found there.

## Commands

Uses **Bun** as the package manager/runtime (per spec §7.0) — commit `bun.lock`, never `package-lock.json`/`yarn.lock`. Use `bunx` instead of `npx`.

`bun install` at the repo root installs all workspaces.

**Frontend** (`nextjs/`):

- `bun run dev` — dev server (http://localhost:3000)
- `bun run build` / `bun run start` — production build / serve
- `bun run lint` — ESLint (flat config via `eslint.config.mjs`)
- `bun test` — component tests (Bun runner + `@testing-library/react` + happy-dom). `happydom.ts` (preload via `bunfig.toml`) registers the DOM and mocks `next/link`. Test files `*.test.tsx` are excluded from the Next.js build type-check (`tsconfig.json`).
- `bun run e2e` — **Playwright E2E** (real Chromium). Tests live in `nextjs/e2e/*.e2e.ts` (named `.e2e.ts` so `bun test` ignores them; excluded from the build type-check). Reuses a dev server on :3000 if running, else builds + starts production.

> **⚠️ MANDATORY: run `bun run e2e` to verify every frontend change.** Unit tests (happy-dom) cannot see real layout/hydration — e.g. the "navbar ทับกัน" overlap (a bare `nav {}` CSS rule fixing the footer/breadcrumb `<nav>`s to the top) passed all unit tests but E2E caught it. The E2E suite smoke-checks every public page for: a visible `<h1>` (content didn't collapse), no footer/breadcrumb `<nav>` overlapping the navbar, no console/hydration errors, and a working TH/EN language switch. Add an E2E case when adding a page or interactive UI.

**Backend** (`nestjs/`):

- `bun run start` / `bun run start:dev` — serve / watch (http://localhost:4100; override with `PORT`)
- `bun run build` — Nest build
- `bun test` — **Bun's native test runner** (not Jest). Test files: `*.spec.ts` under `test/`. e2e tests boot the Nest app via `@nestjs/testing` + `supertest`.
- `bun run lint` — ESLint

### Env files — dev vs production

Both apps follow the same convention (env files are gitignored; the committed
`*.env.example` is the template of names):

- **Local development → `.env.local`.** Loaded when running `bun run dev` /
  `start:dev` and the test runners on your machine.
- **Production → `.env`.** The plain `.env` holds the production values (the same
  keys as the example). Set the same keys in the Vercel project's Environment
  Variables for the deployed runtime.

So for `nestjs/`: local secrets in `nestjs/.env.local`, prod in `nestjs/.env`
(both gitignored; template `nestjs/.env.example`). Same for `nextjs/`. When a
value is shared across the two apps (e.g. `GITHUB_REFRESH_SECRET`), keep it
identical in both apps' files for the environment you're running.

## Architecture — `nextjs/`

Next.js App Router, Tailwind v4 (CSS-based config, no `tailwind.config.js`), `next-intl`-style
locale context, path alias `@/*` → `nextjs/` root. This is a **large, live app** — not a scaffold.
When touching an area, read the code + the relevant ADR (`docs/adr/`); highlights:

- **Public site** (`app/`): `page.tsx` (home), `about`, `projects` + `projects/[slug]`,
  `team/[slug]`, `blog` + `[slug]`, `faq`, `contact`, `chat`. Sections in
  `components/site/**` + `components/pages/**` (mostly hook-free presentational + a server
  wrapper that injects data — the tested pattern; see `e2e/` note above).
- **Member self-service CMS** (`app/member/**`, `app/auth/callback/`): GitHub-OAuth login →
  a member edits their own profile / skills / stack / README (toggle + override) / project
  selection, and authors certificates + blog as drafts. See **ADR 0005** (content model) +
  **ADR 0006** (auth).
- **Admin CMS** (`app/admin/(dash)/**`): projects/services/blog/faqs/certificates/taxonomy CRUD,
  a members roster + an approvals queue. Admin = a member flagged `members.is_admin` (same
  GitHub login) OR the `ADMIN_EMAILS` fallback — `lib/admin-access.ts`. **ADR 0006**.
- **Data layer** (`lib/`): Supabase, **DB-first with a static fallback** — `*-repo.ts` read via
  three clients: `public-db.ts` (anon, cookieless, for static/ISR public reads), `server.ts`
  (cookie, authenticated — admin actions + member session reads), `client.ts` (browser —
  member self-edit writes). Pure snake→camel mappers (`*-map.ts`) are unit-tested; content
  seeds/fallbacks live in `content/{site,catalog,blog,faqs}.ts`.
- **Authorization is enforced in the DB, not the app** — RLS on every content table + column
  grants + `is_app_admin()` SECURITY DEFINER (no service-role key). App-layer `assertAdmin()`
  is defense-in-depth only. **Read [ADR 0007](docs/adr/0007-db-enforced-authz-rls-is-app-admin.md)
  before touching any auth/RLS/admin-write path**, and use `security-review` for every such change.
- **Chat** (`app/chat`, `components/chat/**`): Open WebUI-style app-shell, streaming SSE,
  image/vision, full Markdown, a floating popup sharing the conversation.

## Architecture — `nestjs/`

Nest.js backend, Bun runtime, port 4100. Feature modules under `src/<feature>/` (module +
controller + service), wired into `src/app.module.ts`; `src/main.ts` bootstraps (CORS, body
limits). Shipped modules include: `health/`, `database/` (Drizzle over the Supabase Supavisor
pooler; schema in `src/database/schema/*.ts`, migrations in `drizzle/`), `llm/` +
`chat/` (RAG + streaming SSE), `ingestion/`/`rag/`/embeddings (pgvector), `github/` (sync +
curate + generate + detail + heal), `rank/` (AI display-ranking — **ADR 0008**), `content/`.
The DB connection is the **Postgres superuser pooler** (bypasses RLS) — so backend writes
(GitHub sync, rank job, seeds) are not subject to the frontend's RLS policies. Keep the RAG
core framework-agnostic — Nest.js only wires it.

## Writing conventions

**GitHub issue comments and PR descriptions must be bilingual — both Thai and English.** Lead with one language and follow with the other (e.g. an **EN:** paragraph and a **TH:** paragraph, or clearly separated sections). This applies **only** to content written into the GitHub tracker (issue comments, PR descriptions). Everything else — chat replies, reports, and status updates outside GitHub — follows the user's preferred language (Thai) and is not required to be bilingual. Repository documentation stays English unless the user explicitly requests otherwise. Code, commit messages, identifiers, and inline code comments stay in English.

## Agent skills

Repository skill instructions are canonical in `.agents/skills/` (47 tracked). `.claude/skills/`
contains thin discovery wrappers that forward to those files so Claude Code and other agents use the
same workflow without maintaining duplicate bodies.

**Three mandatory gates are NOT in this repo** — they resolve from a user-level install, so a fresh
clone is missing them and nothing says so until a gate quietly does not run. Install them before
relying on the pipeline:

<!-- external-skills:start -->

| Gate | Source | Install |
|---|---|---|
| `code-review` | mattpocock skills | `/setup-matt-pocock-skills` |
| `tdd` | mattpocock skills | `/setup-matt-pocock-skills` |
| `t4-dev-workflow` | T4 team skill set (user-level by design) | installed with the other `t4-*` skills |

<!-- external-skills:end -->

Vendoring their bodies here is a separate call (third-party content in a public repo); declaring the
dependency is not. A test holds this list to the gates `CLAUDE.md` actually makes mandatory:
`nestjs/test/gate-skills-resolve-in-repo.spec.ts` — it fails if a gate is named mandatory while
resolving neither in `.agents/skills/` nor here.

### Issue tracker

Issues live in GitHub Issues (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Architecture decisions live in `docs/adr/` (indexed by `docs/adr/README.md`) — read the
relevant ADR before touching its area, and **write a new ADR (never edit-to-reverse) for any
hard-to-reverse decision** (see the `t4-engineering-records` skill). ADRs 0005–0008 cover the
member CMS, unified GitHub auth, DB-enforced authz, and AI ranking. The `nextjs/` + `nestjs/`
packages both exist; a `CONTEXT-MAP.md` can be added if the domain docs grow to need it. See
`docs/agents/domain.md`.
