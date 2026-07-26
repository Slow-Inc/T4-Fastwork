# PRD: Public-read latency — a cache strategy that survives serverless

**Parent issue:** [#234](https://github.com/Slow-Inc/T4-Fastwork/issues/234)
**Date:** 2026-07-26
**Status:** Proposed
**Source:** measurement on production + a 3-agent brainstorm round (codex `gpt-5.6-sol`, antigravity
`Claude Opus 4.6 (Thinking)`, a gateway model) + verification against the vendored Next 16 docs
**Records the runtime it depends on:** [ADR 0014](../adr/0014-serve-both-vercel-apps-behind-cloudflare.md)

## Problem Statement

`/projects` costs **1.4–1.6 s on every request** — measured on production, `Cache-Control: no-store`
and `x-vercel-cache: MISS` four requests in a row. Control pages that are prerendered serve in
**0.07–0.11 s**. Every visitor pays a full Supabase round-trip, and the same is true of `/blog`.

Three facts make this harder than "add a cache", and each was verified rather than assumed:

1. **The page is dynamic by construction.** `app/projects/page.tsx` awaits `searchParams` to read the
   filter. Every public page that reads `searchParams` is uncached; every page that does not is
   `PRERENDER`. The filter is a plain GET form because deep-linkable, shareable, **JS-free** filtering
   is a stated requirement (§4.2) — so moving it to client JS is not available.
2. **Process memory does not survive on serverless.** Already proven here: the module-scope memo in
   `column-ladder.ts` (#207, shipped `#233`) removed three failing selects per read and only took
   `/projects` from 3.2–3.7 s to 1.4–1.6 s — never sub-second.
3. **`'use cache'` and `'use cache: remote'` both fall back to a per-process in-memory LRU** unless
   `cacheHandlers` is configured (vendored docs, `cacheHandlers.md:24,66`), and `next.config.ts` is
   empty. Next 16 also **removed `experimental.ppr`**; a static shell on a `searchParams` page now
   requires top-level `cacheComponents: true`, which changes caching semantics app-wide.

And one constraint that rules out the obvious edge fix: **Cloudflare serves HTML `cf-cache: DYNAMIC`
on purpose** — "Cache Everything" fights the on-demand revalidation that makes a sync visible ≤10 min
(ADR 0004, epic #185). Cloudflare is not a latency lever here.

## Goal

`/projects` warm **under 1 second** without weakening the ≤10-minute freshness guarantee or the
JS-free deep-linkable filter — and with the *reason* for the chosen caching model written down, so the
next page with the same shape does not re-litigate it.

**Explicit non-goal:** matching `/faq`'s 0.07–0.11 s. That requires the CDN to serve HTML without
invoking a function, which needs either `cacheComponents: true` or a URL redesign. Both are deferred
(see D4).

## Solution (locked for D1–D3)

Cache the **unfiltered** project list in the durable Data Cache and keep filtering in memory, so one
entry serves every query-string combination and no filter can fragment the cache.

- **The failure path is never cached.** `getAllProjects()` has always swallowed errors into `[]`;
  stored durably, that blanks the page for the whole TTL. So the cacheable function **throws** on
  failure and the swallow lives outside the cache boundary.
- **A broken cache degrades to slower, never emptier.** If the cache layer itself fails, fall back to a
  direct read.
- **`unstable_cache`, not `'use cache'`** — it targets the Data Cache, documented to persist "across
  requests and deployments", instead of the per-process LRU that fact 3 above describes.
- **Invalidation by tag, with a TTL as a ceiling only.** One tag name (`PROJECTS_CACHE_TAG`) that every
  writer busts; the 600 s ceiling exists solely to bound a *missed* invalidation.

## Deliverables

| # | Slice | Acceptance |
|---|---|---|
| **D1** | Failure boundary + durable cache on the unfiltered read | a failed read is never stored; a cache-layer failure falls back to a direct read; the filter still runs in memory |
| **D2** | Tag invalidation from **every** writer — the secret-guarded `/api/revalidate` route **and** the admin Server Actions | a project write busts the tag; `revalidatePath` retained |
| **D3** | Prove it on production | a warm request demonstrably does **not** hit Supabase (not just a better number), warm p95 < 1 s, and a post-write probe shows the change visible well inside 10 min |
| **D4** | ADR: caching strategy per public surface | records which pages are static / ISR / deliberately dynamic, and decides whether `cacheComponents: true` or per-filter routes is the path to CDN-class latency — **decision, not implementation** |

## Non-goals

- Enabling `cacheComponents: true` (app-wide semantics change) — that is D4's decision to make, not
  this PRD's to assume.
- Prerendering arbitrary filter combinations: `q` is free-text search, so it cannot be enumerated, and
  category × tag × tech is combinatorial.
- Turning on Cloudflare "Cache Everything" — rejected in ADR 0014.
- `/blog` (same `searchParams` shape) — listed in D4, fixed only once the strategy is decided.
- Caching `getProjectBySlug`. The detail read has the same shape and is a natural follow-up, but
  `/projects` is what was measured.

## Risks

| Risk | Detection |
|---|---|
| A writer misses the tag → stale list | post-write probe; the 600 s ceiling bounds the damage |
| `revalidateTag` does not actually bust the Data Cache entry | D3's probe must fail the slice if the change is not visible |
| "False performance success" — the number improves but the DB is still hit | D3 requires proving the read was skipped, not that latency dropped |
| The durable Data Cache does not behave durably on our deployment | D3 measures it; if it fails, D1's fallback keeps the page correct and D4 becomes the only path |

## Human follow-ups

- **D4's decision** needs an owner: `cacheComponents: true` (app-wide) vs per-filter routes (URL
  redesign). Both are hard to reverse.
- Applying migrations `0032`/`0033` is independent but complementary — it removes the remaining failing
  selects on a cold instance. Still awaiting explicit production-write authorization.
