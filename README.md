# T4 Fastwork

The live website of **T4 Labs** — a Thai software studio that builds SaaS products, web
applications, and AI features. This repository is the whole site: a public portfolio, an AI
assistant that answers questions about our work, a bilingual blog, and the CMS the team edits it
with.

The site is at **[t4labs.dev](https://t4labs.dev)**.

## What it does

**Portfolio that maintains itself.** Projects come from GitHub. When a repository is public, the
site treats that visibility as permission to publish it: it syncs the repo, writes the Thai and
English copy from the README, classifies the project into a category with its technologies and
tags, captures a cover image, and ranks the results so the strongest work leads. No one
hand-maintains project pages.

**AI assistant grounded in real work.** A streaming chat assistant answers questions about our
projects, services, and pricing using retrieval over the site's own content, so answers cite what
we have actually built rather than inventing it. It runs both as a floating panel on any page and
as a full chat page, sharing one conversation between them.

**Bilingual by default.** Every public page reads in Thai and English, switchable in place.

**Two CMSs, both narrow.** Team members sign in with GitHub and edit only their own profile,
certificates, and articles. Admins review submissions and manage the catalog. Authorization is
enforced in the database rather than trusted to the app.

## Stack

- **[Bun](https://bun.sh)** as the runtime and package manager, one lockfile across two workspaces
- **[Next.js](https://nextjs.org) 16** (App Router) + TypeScript + Tailwind — the site itself
- **[Nest.js](https://nestjs.com)** — the API: retrieval-augmented chat, GitHub sync, the content
  generators, and the ranking job
- **[Supabase](https://supabase.com)** — Postgres with pgvector for retrieval, plus auth and
  storage; the backend connects through the transaction pooler with Drizzle
- **[Playwright](https://playwright.dev)** — real-browser end-to-end checks on every public page
- Deployed on **[Vercel](https://vercel.com)**

## Layout

```
nextjs/    the public site, member area, and admin CMS
nestjs/    the API — chat + retrieval, GitHub sync, generators, ranking
docs/      architecture decision records and product specs
```

## Running it

```bash
bun install          # installs both workspaces from the repo root

cd nextjs && bun run dev     # site  → http://localhost:3000
cd nestjs && bun run start:dev   # API → http://localhost:4100
```

Both apps read local secrets from `.env.local`; `.env.example` in each workspace lists the names
they expect. Tests are `bun test` in either workspace, and `bun run e2e` in `nextjs/` runs the
browser suite.

## How we work

Every change is tracked as a GitHub issue, implemented test-first, and reviewed against the diff
that will actually merge before it lands. Decisions that are expensive to reverse are written down
as ADRs in `docs/adr/` instead of living in someone's memory. Much of the day-to-day work is done
by AI agents following the operating standard in `CLAUDE.md` — the goal being a site that keeps
itself current with as little routine human upkeep as possible.
