# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo root. Currently it contains:

- **`nextjs/`** — the Next.js frontend app.
- **`Obsidian-Fastwork/`** — a personal Obsidian vault (notes), not part of the codebase. It's gitignored.

More packages (e.g. a `backend/`) may be added as siblings of `nextjs/` in the future.

## ⚠️ Non-standard Next.js version

`nextjs/` pins `next@16.2.10` — a version newer than your training data, with breaking changes to APIs, conventions, and file structure. **Before writing or modifying any Next.js code, read the relevant guide under `nextjs/node_modules/next/dist/docs/`** (organized as `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`) rather than relying on prior knowledge of Next.js. Heed any deprecation notices found there.

## Commands

Run from the `nextjs/` directory:

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint (flat config via `eslint.config.mjs`)

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
