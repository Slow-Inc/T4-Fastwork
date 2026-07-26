---
tags:
  - engineering
  - operations
  - performance
description: Both apps run on Vercel serverless behind Cloudflare, so a page passes three independent cache layers — know which one a fix actually targets before claiming a speedup.
source: T4 Fastwork, 2026-07-26 — measured while investigating #234 (/projects uncached)
---

# Three Cache Layers on Serverless

**Live topology: Hostinger (registrar) → Cloudflare (DNS + CDN/proxy) → Vercel.** Both apps are on
Vercel **serverless** — `nextjs/` (frontend) and `nestjs/` (backend, through the `api/index.ts`
handler, *not* `src/main.ts`). A request therefore passes three caches that fail in different ways, and
a performance fix that does not name which layer it targets is a guess.

| Layer | Invokes a function? | Measured on this deployment | Lever? |
|---|---|---|---|
| **Cloudflare** (front) | no | `cf-cache: DYNAMIC` for HTML, on purpose | **No** — see below |
| **Vercel CDN / ISR** (`x-vercel-cache`) | no on `PRERENDER` | `/about` 0.07 s · `/team/[slug]` 0.11 s · `/faq` 0.08 s warm | **Yes — the only layer proven fast here** |
| **In-function** (`use cache`, module memo) | yes | `/projects` 1.4–1.6 s | Weak on serverless |

## Cloudflare is not a lever, and that is a recorded decision

HTML is served `cf-cache: DYNAMIC` deliberately. Turning on Cloudflare **"Cache Everything" for HTML is
a documented no-go** — it fights the ISR / on-demand revalidation path (#92), which is what makes an
admin edit or a sync visible without a redeploy. Reaching for it to fix a slow page trades the
freshness guarantee for latency, silently.

## In-function caching is weaker than it reads on serverless

Per the vendored Next 16 docs (`cacheHandlers.md:24,66`): with no `cacheHandlers` configured,
`'use cache'` **and `'use cache: remote'`** both fall back to an **in-memory LRU isolated to each
Next.js process** — "each instance will have its own cache that isn't shared with others and is lost on
restart". On serverless that is per-invocation-instance, so the hit rate is whatever instance reuse
happens to be.

**This is not theoretical — it was measured here.** The module-scope memo in `createColumnLadder`
(#207, shipped in #233) removed three failing selects per read and took `/projects` from 3.2–3.7 s to
**1.4–1.6 s — never sub-second**, precisely because instances are not reused enough. Any plan whose
cache lives in process memory will reproduce that ceiling.

`unstable_cache` is a different mechanism (the Data Cache; its doc claims persistence "across requests
and deployments", which process memory cannot do) — but whether that holds on *this* deployment is an
empirical question to measure, not to assert.

## Measured — 2026-07-26, and the question above is now answered (#240)

`unstable_cache` **is** durable across invocations here. On production after #239:

- **16 warm requests to `/projects` produced 0 database calls** — `pg_stat_statements` on the
  PostgREST list query: 3381 → 3381 → 3382 → 3382, where the single `+1` is a refill forced by a
  deliberate tag bust.
- **The proof of durability is the invalidation, not the hit rate.** The bust was issued from the
  Route Handler — a *different* function invocation from the reads — and it released the entry. A
  per-process LRU cannot be invalidated from another invocation, so the entry lives in a shared store.
- **Warm p95 0.83 s** (TTFB p95 0.46 s) against a 1.4–1.6 s baseline that paid a Supabase round-trip
  every request. The residual is **function invocation**, not data access: the layer-2 ceiling in this
  note is exactly what remains.
- `revalidateTag(tag, 'max')` **expires an `unstable_cache` entry immediately** here rather than
  serving stale-while-revalidate — the first read after a bust blocked 3.451 s while the next two took
  0.41/0.39 s. The `'max'` profile does not resolve to a cacheLife without Cache Components, so
  `cacheLife` is `undefined` and the entry is simply expired.

**Counters beat clocks.** The clock said 1.4–1.6 s → 0.83 s, which #207 already proved can be true
while every request still hits the database. `pg_stat_statements` is the instrument that answers the
actual question — snapshot, drive N requests, snapshot again, and read the delta.

## How to apply

- **Name the layer before proposing the fix.** "Cache it" is not a plan; "serve it from the Vercel CDN
  without invoking a function" and "avoid the Supabase round-trip inside the function" are different
  changes with different ceilings.
- **A function-side cache cannot reach a CDN-served number** — the function still boots. Sub-second may
  be reachable; 0.08 s is not.
- **Measure from outside and read the headers, not just the clock.** `curl` traverses all three layers;
  `x-vercel-cache` tells you whether layer 2 hit, and wall-clock includes Cloudflare.
- **Verify a cache actually persists before building on it** — warm it, then check that a second
  request truly skipped the work (not just that the number looks better). See
  [[Baselines Before Optimization]].

Related: [[Check the ADRs Before Fixing an Anomaly]] · [[Baselines Before Optimization]] ·
[[Degraded Modes Must Be Observable]]
