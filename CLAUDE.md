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
- **`karpathy-guidelines`** enforces: think before coding (state assumptions, surface
  tradeoffs, don't pick silently), simplicity first, surgical changes, goal-driven execution
  with verification.
- **Shared engineering knowledge:** `Obsidian-Fastwork/` is the committed cross-agent knowledge
  base. At the start of every session, read `Obsidian-Fastwork/Home.md` first, then open only the
  linked notes relevant to the task. Do not load the whole vault blindly. Keep `Home.md` and the
  relevant index current whenever durable knowledge is added.
- Also standing: **TDD is mandatory** and **every frontend change is verified end-to-end**
  (`bun run e2e`) — see the ⚠️ note under Commands. Use **`scrutinize` + `security-review`**
  on any auth / RLS / admin-write / security-sensitive change.

Skip only for trivial, non-code conversational replies. These override default behavior; the
user's explicit instructions still win.

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

Target stack per the spec (§7) — **now implemented**:

- Package manager/runtime: **Bun** (migrated — see Commands below)
- Frontend: Next.js App Router + TypeScript + Tailwind + client-side locale context for i18n (TH/EN)
- Backend: **Nest.js as a separate API layer** in `nestjs/` (decided — see the wayfinder map #1)
- Database: Supabase (Postgres + pgvector for RAG + Auth + Storage + Realtime); backend connects via the Supavisor transaction pooler (6543) with Drizzle
- AI: streaming LLM via an OpenAI-compatible gateway (`CUSTOM_OPENAI_*` env) + RAG via pgvector
- Deploy: Vercel, or self-hosted behind Cloudflare

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

Repository skill instructions are canonical in `.agents/skills/`. `.claude/skills/` contains
thin discovery wrappers that forward to those files so Claude Code and other agents use the same
workflow without maintaining duplicate bodies.

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
