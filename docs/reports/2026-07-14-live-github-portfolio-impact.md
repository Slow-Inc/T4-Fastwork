# Impact report — Live GitHub team portfolio + serverless freshness

Date: 2026-07-14 · Epic #16 (ADR 0003) + Phase 2 #25 (ADR 0004) · PRs #26, #29, #32

## What shipped

A self-updating "live GitHub" layer for the T4 Labs site: team/project pages
render real GitHub data (repos, stars, contributors, avatars, profile READMEs)
from a durable Supabase snapshot, and that snapshot self-freshens on serverless
without any polling — the "double" (a viewer is served stale instantly, the page
heals from GitHub, and the fresh data is pushed to that same viewer live).

- **Backend** (`nestjs/src/github/`): ETag/304 fetch layer (`github.service.ts`),
  `github_snapshots` durable store (`drizzle-snapshot.store.ts`), public read API
  (`github-read.service.ts`), secret-guarded `POST /github/refresh` + `/github/heal`
  with `pg_try_advisory_xact_lock` single-flight, HMAC+dedup `POST /github/webhook`,
  stale-while-heal (`github-heal.service.ts`).
- **Frontend** (`nextjs/`): live overlay with `content/site.ts` fallback
  (`lib/github.ts`), `after()` heal-on-read (`lib/heal.ts`), Realtime "double"
  (`lib/live-snapshot.ts` + `lib/live-actions.ts` `updateTag` + `LiveSnapshot`).
- **Data** (Supabase, prod): `github_snapshots` table with anon-SELECT RLS +
  `supabase_realtime` publication; migrations `0001_daffy_ulik`,
  `0002_showcase_projects_columns`, `enable_realtime_github_snapshots`.
- **Ops**: hourly `.github/workflows/github-refresh-cron.yml` safety-net; org
  webhook on `Slow-Inc`; backend runs as a Vercel serverless function
  (`nestjs/api/index.ts`, `nestjs/vercel.json`).

## Blast radius

- **Prod DB**: additive migrations + one anon-SELECT RLS policy on public GitHub
  data only (no new exposure — `/security-review` passed clean; `resolveHealTarget`
  charset-hardened in `2694c71`). No other table touched.
- **Serverless cost**: idle = zero work (event-driven, no timer/loop); ETag/304
  collapses no-change refreshes to no upsert/no broadcast.
- **Secrets**: `GITHUB_TOKEN`/`GITHUB_REFRESH_SECRET`/`GITHUB_WEBHOOK_SECRET`
  server-only; frontend `GITHUB_REFRESH_SECRET` + Actions `BACKEND_REFRESH_SECRET`.

## Validation (verified 2026-07-14)

- Tests: nestjs 124 pass (1 known env-only fail), nextjs 197 unit + 42 e2e + build green.
- Activation: cron `POST /github/refresh` → **HTTP 201** (synced 12 keys, `changed: org:Slow-Inc`);
  org webhook (hook `652601508`) ping delivery → **200** (backend HMAC verified);
  heal-on-read live (frontend env set + redeploy, prod pages 200); `github_snapshots`
  confirmed in the `supabase_realtime` publication; prod table holds 19 rows.

## Known residuals (non-blocking, tracked in the ledger)

- No end-to-end automated test simulating a real Realtime broadcast → UI swap
  (pure seams + mount are covered; verified by reasoning + manual).
- Cloudflare Cache Rule for `/github/*` is an infra step, moot on the current
  Vercel-direct deploy.
- Webhook `refreshOwner` re-syncs repo lists, not per-repo showcase detail
  (contributors/pulls/readme freshen via cron + heal-on-read).
- Pre-existing Supabase advisors: `rls_disabled_in_public` on ~13 unrelated public
  tables (needs its own security pass).
