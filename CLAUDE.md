# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo root. Currently it contains:

- **`nextjs/`** — the Next.js frontend app.
- **`Obsidian-Fastwork/`** — a personal Obsidian vault (notes), not part of the codebase. It's gitignored.

More packages (e.g. a `backend/`) may be added as siblings of `nextjs/` in the future.

## Product context

This is not a blank scaffold — it's the start of **T4 Labs**' agency/portfolio website (Bigzweb-style): a project/portfolio showcase with category+tech filtering, an AI chat assistant (RAG over projects/services/FAQ) that recommends matching case studies, a bilingual (TH/EN) blog, an admin/CMS, and lead-gen flows funneling visitors to hiring (Fastwork or a contact form).

**Full requirements (Thai): `Requirement.MD` at the repo root — read the relevant section before implementing any page, component, or data model.**

Target stack per the spec (§7) — not yet fully reflected in the current scaffold:

- Package manager/runtime: **Bun** (migrated — see Commands below)
- Frontend: Next.js App Router + TypeScript + Tailwind + `next-intl` for i18n (scaffold matches everything except i18n)
- Backend: Nest.js as a separate API layer, or Next.js API routes/Server Actions if staying single-package
- Database: Supabase (Postgres + pgvector for RAG + Auth + Storage + Realtime)
- AI: streaming LLM API (OpenAI/Claude) + RAG via pgvector
- Deploy: Vercel, or self-hosted behind Cloudflare

Phased roadmap: **Phase 1** MVP (portfolio + CMS) → **Phase 2** AI chat + RAG + blog → **Phase 3** full i18n, analytics, performance polish.

## ⚠️ Non-standard Next.js version

`nextjs/` pins `next@16.2.10` — a version newer than your training data, with breaking changes to APIs, conventions, and file structure. **Before writing or modifying any Next.js code, read the relevant guide under `nextjs/node_modules/next/dist/docs/`** (organized as `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`) rather than relying on prior knowledge of Next.js. Heed any deprecation notices found there.

## Commands

Uses **Bun** as the package manager/runtime (per spec §7.0) — commit `bun.lock`, never `package-lock.json`/`yarn.lock`. Use `bunx` instead of `npx`.

Run from the `nextjs/` directory:

- `bun install` — install dependencies
- `bun run dev` — start the dev server (http://localhost:3000)
- `bun run build` — production build
- `bun run start` — serve the production build
- `bun run lint` — run ESLint (flat config via `eslint.config.mjs`)

There is no test runner configured in this project yet.

## Architecture — `nextjs/`

Standard Next.js App Router layout:

- `app/layout.tsx` — root layout; loads the Geist Sans/Mono fonts via `next/font/google` and sets base HTML/body structure.
- `app/page.tsx` — the home page (currently the default `create-next-app` starter content).
- `app/globals.css` — global styles, Tailwind CSS v4 entry point (via `@tailwindcss/postcss`, no `tailwind.config.js` — v4 uses CSS-based config).
- `public/` — static assets (SVGs).

Path alias `@/*` resolves to the `nextjs/` root (see `nextjs/tsconfig.json`).

The codebase is currently the unmodified `create-next-app` scaffold — no custom routes, components, or data layer exist yet.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`. Revisit as multi-context (`CONTEXT-MAP.md`) once a second package (e.g. `backend/`) is added.
