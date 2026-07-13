# Live GitHub Team Portfolio — Design Spec / PRD

**Date**: 2026-07-13
**Status**: Draft (design approved; pending spec review)
**Decision record**: [ADR 0003](../../adr/0003-github-live-team-portfolio.md) · extends [ADR 0001](../../adr/0001-deploy-frontend-and-backend-to-vercel.md)
**Scope**: `nestjs/src/github/` (new), `nextjs/` team pages + a snapshot client, a Supabase table, a webhook + cron

---

## Problem

`nextjs/content/site.ts` holds the team's repos/stats as **static, hand-authored data** that goes
stale the moment anyone pushes. We want `/team` and the six `/team/[slug]` pages to show **live
GitHub data** — each member's repos and the `Slow-Inc` org's "team work" — kept near-realtime,
**without hitting GitHub's rate limits**, on Vercel serverless behind Cloudflare. The sibling
`resume_web` proves the fetch pattern but its cache is dead on serverless (see ADR 0003).

## Goals

- Team pages render **live** GitHub data (repo list, description, stars, languages, `pushed_at`).
- **Zero user-traffic GitHub calls** → rate limit effectively impossible.
- **Near-realtime freshness:** org/team work **< 5 s** (webhook); personal repos **~1 min** (poll).
- **Resilient:** never error/blank on a read if any snapshot (or the `site.ts` fallback) exists.
- **Server-only token** — no GitHub token in the client bundle.

## Non-goals (v1 — deferred to Phase 2)

- **GitHub App** (personal-repo webhooks + higher ceiling) — v1 uses a fine-grained PAT.
- **Supabase Realtime live-push** to open tabs — v1 freshness for a viewer is ISR + client SWR.
- **GraphQL** call-collapsing — REST + ETag + delta is under the limits at this scale.
- Admin/CMS editing of team identity — `site.ts` stays the curated source.

## Architecture

```
── WRITE (only path that touches GitHub) ────────────────────────────
GitHub org webhook (Slow-Inc: push/repository/star)
      │ ~1–2s, HMAC-verified
      ▼
POST /github/webhook (nestjs) ── dedup(X-GitHub-Delivery) ── coalesce ──┐
                                                                        │
external cron / Vercel Cron ── POST /github/refresh (secret) ──────────┤
   (tiered ETag poll: repo lists ~1min; per-repo metadata on pushed_at delta)
                                                                        ▼
                          fetchGitHub() [server PAT + If-None-Match]  (cap concurrency, backoff,
                                                                       pg_advisory_xact_lock single-flight)
                                                                        ▼
                          Supabase github_snapshots (JSONB + etag)   ← durable source of truth

── READ (nextjs renders, never calls GitHub) ────────────────────────
User ─► Cloudflare CDN ─► Vercel/Next ─► GET /github/team, /github/repos/:login (nestjs)
           └─ reads Supabase snapshot; serve-stale; stale-while-heal (age>threshold → bg refresh)
        Next ISR + Cache-Control(SWR) + Cloudflare Cache Rule + client SWR(revalidateOnFocus)
```

Rate-limit math (v1): full refresh ≈ ~150 REST calls; PAT primary = 5,000/hr; with ETag/`304`
(free) + `pushed_at` delta the steady-state hot poll is ~7 conditional calls/min → orders of
magnitude under both the primary and the ~900/min secondary limit.

## Data model (Supabase, via Drizzle in `nestjs/src/database/schema`)

```
github_snapshots
  key         text primary key      -- "repos:<login>" | "org:Slow-Inc" | "languages:<login>/<repo>"
  data        jsonb not null        -- the fetched/derived payload
  etag        text                  -- last GitHub ETag for conditional requests
  pushed_at   timestamptz           -- for delta detection (repo resources)
  updated_at  timestamptz not null  -- our last successful write
```
RLS: anon `SELECT` allowed (public portfolio). Writes only via the server (service role / server
key), never the browser.

## Module changes

**New: `nestjs/src/github/`**
- `github.service.ts` — `fetchGitHub(url, etag?)` (port from `resume_web`, server PAT, handles
  `304` = keep prior), `refreshMember(login)`, `refreshOrg('Slow-Inc')`, `readSnapshot(key)`,
  concurrency-capped batch, `pg_advisory_xact_lock` single-flight, backoff.
- `github.controller.ts` — `POST /github/refresh` (secret-guarded, full/tiered refresh),
  `POST /github/webhook` (HMAC `X-Hub-Signature-256` on raw body → targeted refresh),
  `GET /github/team`, `GET /github/repos/:login`.
- `github.module.ts` — wire into `app.module.ts`; depends on `database`.
- Config: member list of GitHub logins + the org, read from a small config (mirror `site.ts`).

**Modified: `nextjs/`**
- `lib/github.ts` — client that calls the nestjs API with Next caching tags + client SWR.
- `app/team/page.tsx`, `app/team/[slug]/page.tsx` — data source `site.ts` → live snapshot, with
  `site.ts` fallback; keep the existing components (`team-section`, `team-member-view`, etc.).
- `content/site.ts` — trim live-changing fields; keep curated identity + featured-repo selection.

**New: `.github/workflows/refresh-github.yml`** (or external cron) — hits `/github/refresh` on a
~1-min cadence with the shared secret.

## Acceptance criteria / testing (TDD)

| Unit | What to test |
|---|---|
| `fetchGitHub` | 200 stores data+etag; **304 keeps prior data** (empty body not written); 403/429 → backoff |
| conditional/delta | unchanged repo → `If-None-Match` → `304`, no metadata refetch; changed `pushed_at` → refetch |
| webhook verify | valid `X-Hub-Signature-256` on raw body → 2xx; tampered/missing → 401 **before** any work; dup `X-GitHub-Delivery` → no-op |
| single-flight | two concurrent refreshes → only one fetches (advisory xact lock); the other serves stale |
| read/serve-stale | snapshot present → returned; absent → `site.ts` fallback, never error |
| stale-while-heal | snapshot older than threshold → stale served **and** background refresh fired |

- **E2E (`bun run e2e`, mandatory):** `/team` + a `/team/[slug]` render live data (or fallback),
  visible `<h1>`, no console/hydration errors, TH/EN switch works. Add a case per new page/interaction.
- `/security-review` on the webhook + token handling. `/verify` after implementation.

## Risks / traps (from ADR 0003 + multi-model review)

- **Advisory lock on the pooler** — use `pg_advisory_xact_lock` (txn-scoped), not session-level.
- **Next 16 caching** — confirm exact APIs from `nextjs/node_modules/next/dist/docs/` before coding;
  CF needs a Cache Rule to cache JSON.
- **Serverless timeout on full/initial refresh** — chunk + cap concurrency; incremental refreshes
  are small.
- **Backfill/empty first deploy** — seed a refresh on deploy; fallback to `site.ts` until warm.
- **Prerequisite:** nestjs-on-Vercel serverless (ADR 0001) must land first.

## Phased rollout (seeds the GitHub issues)

- **P0** Supabase `github_snapshots` table + Drizzle migration + RLS.
- **P1** `nestjs/src/github` fetch layer (`fetchGitHub`+ETag+304, snapshot read/upsert) — TDD.
- **P2** `POST /github/refresh` (secret) — tiered poll, delta, concurrency cap, single-flight.
- **P3** `POST /github/webhook` (HMAC, dedup, targeted refresh) + org webhook setup + cron.
- **P4** `nextjs` read/render — `lib/github.ts`, team pages → live + fallback, ISR/SWR + CF Cache Rule.
- **P5** Token server-only, RLS, `/security-review`; stale-while-heal.
- **P6** `/verify` + `bun run e2e`; docs (impact-report entry).
- **Phase 2 (separate epic):** GitHub App, Supabase Realtime live-push, GraphQL.
