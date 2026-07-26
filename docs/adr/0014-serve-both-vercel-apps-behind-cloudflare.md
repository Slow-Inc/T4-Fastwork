# ADR 0014 — Serve both Vercel serverless apps behind Cloudflare (Hostinger registrar)

**Status**: Accepted
**Date**: 2026-07-26
**Relates to**: [ADR 0001](0001-deploy-frontend-and-backend-to-vercel.md) (deploy both apps to Vercel) · [ADR 0004](0004-serverless-realtime-freshness.md) (serverless-native freshness) · issue #234 (uncached `/projects`)

**Records, does not reverse:** ADR 0001 already decided *both apps on Vercel as serverless functions*.
This ADR records the **delivery path in front of them** and the operational consequences that were
learned in production but never written down as a decision.

## Context

ADR 0001 quotes `CLAUDE.md` as naming the target "Vercel, **or** self-hosted behind Cloudflare" — an
either/or that survived in `CLAUDE.md` for weeks after ADR 0001 removed the ambiguity, and never
mentioned the word *serverless*. Meanwhile the domain migration to `t4labs.dev` put a real Cloudflare
proxy in front of Vercel. The result: the load-bearing runtime facts lived in three places (an ADR, a
migration log, and production headers) and agreed with none of them completely.

That gap produced concrete waste, all of it recent and measured:

- A performance investigation (#234) proposed caching strategies without accounting for the runtime,
  including one (`'use cache: remote'`) that silently degrades to per-process memory here.
- A per-process memo (#207, shipped in #233) was expected to make `/projects` sub-second and did not —
  3.2–3.7 s → **1.4–1.6 s**, because serverless instances are not reused enough for a module-scope
  cache to matter.
- Twice before, backend bootstrap changes were made in `src/main.ts` and had **no effect in
  production**, because the serverless entrypoint is `nestjs/api/index.ts` (#95/#96, then #103/#104).

## Decision

**The live delivery topology is: Hostinger (registrar) → Cloudflare (DNS + CDN/proxy) → Vercel.**
There is no self-hosted option in play. **Both `nextjs/` and `nestjs/` run as Vercel serverless
functions**, and the backend's production entrypoint is **`nestjs/api/index.ts`**, not `src/main.ts`
(which runs only for local `bun run start`); all backend bootstrap config therefore lives in the shared
`src/configure-app.ts`.

Three operational rules follow, and they are the reason this is an ADR rather than a note:

1. **Nothing persists in process memory between requests.** No held loop, no in-process queue, no
   long-lived timer, and no module-scope cache that can be relied on. Anything that must survive a
   request goes to Postgres, to a durable cache, or to a scheduled trigger.
2. **`'use cache'` and `'use cache: remote'` fall back to an in-memory LRU isolated to each process**
   unless `cacheHandlers` is configured (vendored Next 16 docs, `cacheHandlers.md:24,66`). "Just cache
   it" is therefore not a serverless answer. The only layer measured genuinely fast here is Vercel
   `PRERENDER` (`x-vercel-cache`), which serves without invoking a function at all: `/about` 0.07 s,
   `/team/[slug]` 0.11 s, `/faq` 0.08 s warm — versus `/projects` at 1.4–1.6 s dynamic.
3. **Cloudflare serves HTML as `cf-cache: DYNAMIC`, deliberately.** Enabling "Cache Everything" for
   HTML is rejected: it fights the ISR / on-demand revalidation path (#92) that makes an admin edit or
   a GitHub sync visible without a redeploy. That would trade the freshness guarantee for latency,
   invisibly.

## Consequences

**Positive**

- A performance or caching proposal must now name which of the three layers it targets — Cloudflare,
  Vercel CDN/ISR, or in-function — before it can claim a speedup.
- The `main.ts` / `api/index.ts` trap has a decision record instead of only a scar in two issue
  threads.
- `CLAUDE.md` states the topology in the file every agent loads automatically, so the assumption is
  correct before any code is read.

**Negative / risks**

- Cloudflare is not available as a latency lever for HTML while rule 3 holds, so a slow dynamic page
  cannot be papered over at the edge; it has to become prerenderable or get cheaper.
- A page that must read `searchParams` (deep-linkable, JS-free filtering per Requirement §4.2) is
  dynamic under the current caching model. Making such a page CDN-cacheable requires
  `cacheComponents: true` (Next 16 removed `experimental.ppr`), which changes caching semantics
  app-wide — that decision is **not** taken here and belongs to #234.
- `.dev` is HSTS-preloaded, so HTTPS is mandatory and Cloudflare "Flexible" SSL must never be used
  (redirect loop with Vercel). SSL stays Full/Full-strict.

## Alternatives considered

- **Self-hosting behind Cloudflare** (the "or" in the old `CLAUDE.md` line). Rejected: ADR 0001 already
  chose Vercel for both apps for scale-to-zero and one-platform operations; nothing has changed that,
  and keeping the phrase alive only invited wrong assumptions.
- **Cloudflare "Cache Everything" on HTML** for edge-speed. Rejected as above — it breaks
  event-driven revalidation, which is the entire point of ADR 0004 and epic #185.
- **Leaving this undocumented** because ADR 0001 covers Vercel. Rejected: ADR 0001 does not mention
  Cloudflare being live in front, and the three operational rules above had each already cost real
  work.

Measurements and the per-layer table: `Obsidian-Fastwork/Three Cache Layers on Serverless.md`.
