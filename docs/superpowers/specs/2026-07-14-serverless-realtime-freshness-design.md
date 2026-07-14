# Serverless-Native Live Freshness — Design Spec / PRD

**Date**: 2026-07-14
**Status**: Draft (design brainstormed + cross-checked by 2 agents; pending spec review)
**Decision record**: [ADR 0004](../../adr/0004-serverless-realtime-freshness.md) · extends [ADR 0003](../../adr/0003-github-live-team-portfolio.md)
**Tracker**: Phase 2 issue #25 (Supabase Realtime) · epic #16 / #27
**Scope**: `nestjs/src/github/` (heal trigger) · `nextjs/` (server `after()` trigger + a client Realtime subscriber) · Supabase (Realtime on `github_snapshots` + RLS)
**Multi-agent review**: antigravity (Gemini) + claude-9arm (Qwen), independent — strong convergence on Supabase Realtime + event-driven + ETag gate + advisory lock.

---

## Problem

GitHub data is served from a Supabase snapshot (ADR 0003), refreshed only by a
manual/secret `POST /github/refresh`. We want it to **freshen live** without a
held connection or a polling loop, on a **Vercel serverless** deploy:

- Idle (no viewers) → **zero** GitHub calls / jobs.
- On visit → render the snapshot instantly (never block on GitHub).
- Stale snapshot (older than N min) read → fetch fresh + update the store.
- **The current viewer also receives the fresh data** — stale first, then the
  freshened data **pushed** to them (a "double") — **without client polling**.
- Push **only when the data genuinely changed**, and **only while watching**.
- User leaves → everything quiet.

The naive "SSE + backend polls GitHub every N s while connected" model fails on
serverless (`maxDuration` cap; one instance pinned per viewer; polling wastes
calls). See ADR 0004 for the decision.

## Goals

- Live freshness with **no held connection or loop on Vercel**, **no client polling**.
- **Idle = provably free.**
- Current viewer gets the "double" (stale render → fresh push) in ~1s.
- GitHub calls bounded to ~1 per key per real change (safe under 5000/h).
- Reuse the existing Nest.js `github` module; add minimal surface.

## Non-goals (v1)

- A GitHub App (higher webhook fidelity) — v1 uses the PAT + org webhook.
- Per-field live diffing — v1 pushes the whole snapshot row; the client updates
  the affected UI (stars/contributors/avatar).
- Presence-based fan-out tuning — v1 relies on Realtime's per-tab subscription.

---

## Architecture

```
 VIEWER VISITS
   Browser ──► Next.js server component
        │        renders snapshot from Supabase (instant, stale-OK)
        │        + if snapshot age > N min:  after(() => POST heal)   ← non-blocking, no client req
        ▼
   Browser (client component) ──► subscribe Supabase Realtime on github_snapshots (per tab)

 HEAL  (Nest.js serverless, short-lived)
   pg_advisory_xact_lock(key)  ── single-flight (others return immediately)
     └─ fetch GitHub with If-None-Match(etag)
          ├─ 304  → write nothing, broadcast nothing  (genuinely-new gate)
          └─ 200  → upsert github_snapshots(row)       → Postgres change
                                                         → Supabase Realtime broadcast
                                                         → Browser receives → updates UI  ← the "double"

 PARALLEL EVENT SOURCES (no loop, no timer held):
   GitHub webhook (Slow-Inc)  ──► Nest /github/webhook ──► heal path ──► (same broadcast)
   Cron safety-net (~15 min)  ──► heal path                          ──► (same broadcast)

 USER LEAVES → tab closes → Realtime WebSocket closes → auto-unsubscribe → QUIET
```

### Components (mapped to our stack)

| Concern | Component | New / reuse |
|---|---|---|
| Persistent client channel | **Supabase Realtime** on `github_snapshots` | new (enable + RLS) |
| Snapshot store | `github_snapshots` (Supabase, key→JSONB, `updated_at`, `etag`) | reuse (ADR 0003) |
| Heal fetch (ETag + single-flight) | Nest.js `github` module — `syncResource` + a **`healKey(key)`** trigger | reuse + small add |
| Trigger on stale read | Next.js server component using **`after()`** (Next 16) → calls heal | new (small) |
| Push to viewer | **client component** subscribing Realtime → updates UI | new |
| Event: real repo change | `/github/webhook` (exists) → heal path | reuse (org webhook pending) |
| Event: safety net | Vercel Cron (or GitHub Action) → heal path | new (light) |

## The "double" — exact flow

```
t=0.0  Next.js renders the stale snapshot → first paint            [stale]
t=0.0  client component mounts → subscribes Realtime (before heal)
t=0.0  server after(): if stale → POST /github/heal?key=…  (non-blocking)
t~0.3  heal: advisory lock → GitHub fetch (If-None-Match)
t~0.8  200 → upsert snapshot → Realtime broadcasts the row change
t~0.9  client receives UPDATE → updates the affected UI state       [fresh]  ← "double"
       (304 → nothing happens; the stale render stays, correctly)
```

The subscription is established **on mount, before** the heal fires, so no
broadcast is missed. Updating the UI can be a **targeted state update** from the
Realtime payload (preferred — lighter) or `router.refresh()` (re-runs the server
read).

## Data model / Supabase setup

- `github_snapshots` already has `key`, `data (jsonb)`, `etag`, `updated_at`.
- **Enable Realtime** (logical replication) on `github_snapshots`.
- **RLS** (security boundary): anon may `SELECT`/subscribe **only** to snapshot
  rows that are already public read-side data (repos/contributors/readme/user
  profiles) — never any secret-bearing row. Since `github_snapshots` holds only
  GitHub public data (no tokens), an anon SELECT policy on the table is
  acceptable, mirroring the existing anon-read pattern (ADR 0003). No write for
  anon. Reviewed under `/security-review`.
- The client subscribes filtered by the keys the page needs (e.g.
  `repo:Slow-Inc/MangaDock:contributors`, `user:xenodeve`) to avoid over-fan-out.

## Single-flight, rate-limit, idle-quiet

- **Single-flight**: `pg_advisory_xact_lock(hashtext(key))` at the start of heal;
  if not acquired, return `{ healing: true }` immediately — the caller's Realtime
  subscription will deliver the result. Exactly one GitHub call per key per cycle.
- **Rate-limit**: `If-None-Match` → `304` costs no primary quota and short-circuits;
  advisory lock caps concurrency; N-minute staleness caps frequency. Well under
  5000/h for any realistic key count.
- **Idle-quiet (invariant)**: no viewers ⇒ no reads ⇒ no `after()` heal ⇒ no
  broadcasts; webhook fires only on real events; cron is a light fixed cost.
  Prove this in tests (no read ⇒ zero fetch calls).

## Frontend

- A small **`<LiveSnapshot>`** client component per live surface (team avatar,
  project contributors/stars): takes the initial server-rendered data + the
  snapshot key(s), subscribes Realtime, and swaps in fresh data on UPDATE.
  Falls back to the initial data if Realtime is unavailable.
- The server components keep rendering from the snapshot (SSR/ISR) as today; the
  `after()` stale-heal trigger is added where a live surface is read.
- **Fallback** (Realtime down): SWR `revalidateOnFocus` (client-initiated on tab
  focus, not polling) — optional, behind a flag.

## Backend

- Add `POST /github/heal` (secret-guarded, or internal) taking a `key` (or a
  member/repo) → runs the ETag-aware `syncResource` under the advisory lock.
  Reuses `GithubSnapshotService` + `GithubDetailService`.
- The webhook path and the (existing) refresh reuse the same heal core, so all
  three event sources converge on one write path → one broadcast mechanism.
- Advisory-lock helper in the snapshot store (Drizzle raw `pg_advisory_xact_lock`).

## Phasing

| Phase | Deliverable | Depends on |
|---|---|---|
| **R1** | Backend: `healKey` core + advisory-lock single-flight + `POST /github/heal` (reuse syncResource/detail) | ADR 0003 module |
| **R2** | Supabase: enable Realtime on `github_snapshots` + anon-SELECT RLS + `/security-review` | — |
| **R3** | Frontend: `<LiveSnapshot>` client subscriber + swap-in on UPDATE + graceful fallback | R2 |
| **R4** | Next.js `after()` stale-heal trigger on live-surface reads | R1 |
| **R5** | Wire webhook + cron safety-net to the heal path (org webhook setup is the human step) | R1 |

## Testing (TDD)

- **nestjs**: `healKey` single-flight (2 concurrent → 1 GitHub call), ETag 304 →
  no upsert/no broadcast, 200 → upsert + broadcast invoked; heal error → serve-stale.
- **nextjs**: `<LiveSnapshot>` swaps on a simulated Realtime UPDATE; falls back to
  initial data when subscribe fails; stale-check → `after()` trigger fires only
  when stale.
- **e2e** (`bun run e2e`): a live surface renders initial data, then updates when
  a Realtime event is simulated; **idle path makes zero GitHub calls**; TH/EN
  switch + no console errors.

## Risks

1. **Realtime WebSocket drops** → SDK auto-reconnect; SWR-focus fallback.
2. **Heal timeout after long idle** → serve stale (never fail page); cron backstop.
3. **RLS misconfig exposes a row** → the table holds only public GitHub data; a
   `/security-review` gate + a test asserting anon cannot read anything unexpected.
4. **`after()` budget** → heal must be short (ETag + lock); long fetches drop to
   the cron/webhook path.
5. **Broadcast storm** (webhook flood) → advisory lock + ETag collapse duplicates.

## Decisions locked (brainstorm, cross-checked by 2 agents)

- Persistent channel = **Supabase Realtime** (not SSE, not client polling, not a server loop).
- GitHub fetched by **3 events** (heal-on-read via `after()`, webhook, cron safety-net) — no timer/loop.
- **ETag/304** is the "genuinely-new" gate; **advisory lock** is single-flight.
- The "double" is delivered client-side via the Realtime subscription established on mount.
- Reuse the Nest.js `github` module for the heal; do not rewrite as Edge Functions.
