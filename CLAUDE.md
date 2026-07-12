# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Bun-workspaces monorepo (root `package.json` → `workspaces: ["nextjs","nestjs"]`). It contains:

- **`nextjs/`** — the Next.js frontend app (port 3000).
- **`nestjs/`** — the Nest.js backend API (port 4100): AI chat (RAG + streaming SSE), data layer. See the AI Chatbot Backend wayfinder map, [Slow-Inc/T4-Fastwork#1](https://github.com/Slow-Inc/T4-Fastwork/issues/1).
- **`docs/`** — agent config (`docs/agents/`) and design docs.
- **`Obsidian-Fastwork/`** — a personal Obsidian vault (notes), not part of the codebase. Gitignored.

`bun install` at the root installs both workspaces (one root `bun.lock`).

## Product context

This is not a blank scaffold — it's the start of **T4 Labs**' agency/portfolio website (Bigzweb-style): a project/portfolio showcase with category+tech filtering, an AI chat assistant (RAG over projects/services/FAQ) that recommends matching case studies, a bilingual (TH/EN) blog, an admin/CMS, and lead-gen flows funneling visitors to hiring (Fastwork or a contact form).

**Full requirements (Thai): `Requirement.MD` at the repo root — read the relevant section before implementing any page, component, or data model.**

Target stack per the spec (§7) — not yet fully reflected in the current scaffold:

- Package manager/runtime: **Bun** (migrated — see Commands below)
- Frontend: Next.js App Router + TypeScript + Tailwind + `next-intl` for i18n (scaffold matches everything except i18n)
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

**Backend** (`nestjs/`):

- `bun run start` / `bun run start:dev` — serve / watch (http://localhost:4100; override with `PORT`)
- `bun run build` — Nest build
- `bun test` — **Bun's native test runner** (not Jest). Test files: `*.spec.ts` under `test/`. e2e tests boot the Nest app via `@nestjs/testing` + `supertest`.
- `bun run lint` — ESLint

Backend env lives in `nestjs/.env.local` (gitignored; template in `nestjs/.env.example`).

## Architecture — `nextjs/`

Standard Next.js App Router layout:

- `app/layout.tsx` — root layout; loads the Geist Sans/Mono fonts via `next/font/google` and sets base HTML/body structure.
- `app/page.tsx` — the home page (currently the default `create-next-app` starter content).
- `app/globals.css` — global styles, Tailwind CSS v4 entry point (via `@tailwindcss/postcss`, no `tailwind.config.js` — v4 uses CSS-based config).
- `public/` — static assets (SVGs).

Path alias `@/*` resolves to the `nextjs/` root (see `nextjs/tsconfig.json`).

The codebase is currently the unmodified `create-next-app` scaffold — no custom routes, components, or data layer exist yet.

## Architecture — `nestjs/`

Nest.js backend, Bun runtime. Feature modules live under `src/<feature>/` (module + controller + service), wired into `src/app.module.ts`; `src/main.ts` bootstraps (CORS for the frontend origin, port 4100).

- `src/health/` — liveness/readiness probes (`GET /health`, `/health/live`, `/health/ready`).

Planned modules per the wayfinder map (#1): `database/` (Drizzle + pgvector), `ingestion/` (chunk→embed→upsert), `rag/` (retrieval), `chat/` (SSE streaming), `content/`. Keep RAG modules framework-agnostic — Nest.js only wires them.

## Writing conventions

**Reports, GitHub issue comments, and PR descriptions must be bilingual — both Thai and English.** Lead with one language and follow with the other (e.g. an **EN:** paragraph and a **TH:** paragraph, or clearly separated sections). This applies to status updates, resolutions, and any narrative written into the tracker. Code, commit messages, identifiers, and inline code comments stay in English.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`. Revisit as multi-context (`CONTEXT-MAP.md`) once a second package (e.g. `backend/`) is added.
