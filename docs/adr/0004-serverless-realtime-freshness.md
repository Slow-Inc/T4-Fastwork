# ADR 0004 — Serverless-native live freshness via Supabase Realtime + event-driven refresh

**Status**: Accepted (design) · 2026-07-14
**Relates to**: [ADR 0003](0003-github-live-team-portfolio.md) (live team portfolio) · epic #16 / #27 · Phase 2 issue #25
**Spec**: `docs/superpowers/specs/2026-07-14-serverless-realtime-freshness-design.md`

## Context

The showcase reads GitHub data from a Supabase snapshot (ADR 0003). We want the
data to **freshen live** with these behaviors:

- **Idle = zero work** — no viewers ⇒ zero GitHub calls, zero jobs.
- **On visit, render instantly** from the snapshot (never block on GitHub).
- **Stale-while-heal** — a read of a snapshot older than N minutes triggers a fresh fetch.
- **The current viewer also receives the freshened data** (a "double": stale first, fresh pushed) **without client polling**.
- **Push only when the data genuinely changed**, and only while someone is watching.
- **User leaves ⇒ everything goes quiet.**

The naive model — an **SSE connection with a backend loop polling GitHub every N
seconds while the tab is open** — fails on our deploy target: Nest.js runs on
**Vercel serverless functions** (short-lived, `maxDuration` ~300s, cannot hold a
connection or a `while` loop for a whole viewing session; one pinned instance
per viewer does not scale). Client-side polling was rejected by the team as
"trash traffic."

This design was brainstormed and **cross-checked by two independent architect
agents** (Gemini via antigravity, Qwen via claude-9arm) — strong convergence.

## Decision

Adopt a **serverless-native, event-driven** design. The persistent client
connection moves off Vercel and onto **Supabase Realtime**; GitHub is fetched
only by discrete events, never by a held loop.

1. **Persistent channel = Supabase Realtime.** The browser subscribes (per tab)
   to changes on `github_snapshots`. The connection lives on Supabase, not on a
   Vercel function. Tab closes ⇒ WebSocket closes ⇒ auto-unsubscribe ⇒ quiet.
2. **GitHub is fetched by three discrete events — no timers, no held loop:**
   - **Stale-while-heal on read** — when a page renders a snapshot older than N
     minutes, the Next.js server component triggers a heal via **`after()`**
     (post-response, non-blocking; no client request, no held connection).
   - **GitHub webhook** — real repo events (push/star/release) → refresh.
   - **Cron safety-net** (light, ~15 min) — catches missed webhooks during
     idle periods.
3. **"Genuinely new" gate = ETag/304.** Every fetch sends `If-None-Match`. A
   `304` writes nothing and broadcasts nothing — the push pipeline is gated
   behind a real change. (A `304` does not consume the GitHub primary rate
   limit.)
4. **Single-flight = Postgres advisory lock** (`pg_advisory_xact_lock` keyed by
   the snapshot key). Concurrent heals for the same key collapse to one GitHub
   call regardless of viewer count; the others rely on their Realtime
   subscription to receive the result.
5. **The "double"** — the page renders the stale snapshot immediately; the
   client is already subscribed; the heal upserts the fresh snapshot; the row
   change broadcasts via Realtime; the client updates (targeted state update or
   `router.refresh()`). ~1s, non-blocking.
6. **Reuse the existing Nest.js `github` module** for the heal fetch (its
   ETag-aware `syncResource` + snapshot store + webhook path), rather than
   rewriting as Edge Functions. Add only a targeted "heal this key" trigger.

## Alternatives rejected

- **SSE + backend poll-loop** (the naive model) — cannot hold a connection/loop
  on Vercel serverless; one instance per viewer doesn't scale; polling GitHub on
  a timer is wasted work when nothing changed.
- **Client-side polling** — "trash traffic"; wasteful; still not true push.
- **Rewrite the heal as a Vercel Edge Function** — an optimization, but we
  already have a working Nest.js github module (webhook, ETag, snapshot store,
  advisory lock); reuse beats rewrite here.

## Consequences

**Positive**
- Idle is provably free: no viewers ⇒ no reads ⇒ no triggers ⇒ no broadcasts.
- GitHub calls are bounded to ~1 per key per change (ETag + advisory lock), safe
  under the 5000/h PAT ceiling regardless of traffic.
- Serverless-friendly: no held connections/loops on Vercel; Supabase owns the
  persistent channel; scales to many concurrent viewers cheaply.
- The current viewer gets live updates (the "double") with zero client polling.

**Negative / risks**
- Realtime WebSocket can drop → SDK auto-reconnects; fallback to SWR
  `revalidateOnFocus` (client-initiated, not polling) if Realtime is
  unavailable.
- Heal can time out after a long idle (first visitor) → serve stale (never fail
  the page); the cron backstop bounds staleness.
- Requires enabling Supabase Realtime on `github_snapshots` + an anon SELECT RLS
  policy scoped to non-secret snapshot rows (security boundary — see spec).
- `after()` runs post-response inside the same Vercel invocation; the heal must
  be short (ETag fetch, single-flight) so it fits the function budget.

## Follow-ups

- Org webhook on `Slow-Inc` (pending from ADR 0003) feeds event source #2.
- The cron safety-net is the ADR-0003 freshness-cron open item, reused here.
