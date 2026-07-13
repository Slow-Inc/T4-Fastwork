# 0003 — Live GitHub team portfolio: Supabase snapshot + event-driven refresh

Status: Accepted — **impl pending** · Date: 2026-07-13 · Related: extends [0001](0001-deploy-frontend-and-backend-to-vercel.md)

## Context

The team section (Requirement §4.6) currently renders from **static, hand-authored data** in
`nextjs/content/site.ts` — each `TeamMember`'s repos, descriptions, and stats were audited once
via `gh repo view` and frozen into the file. We want the team pages (`/team` and the six
`/team/[slug]` pages) to show **live GitHub data** — each member's repos and the `Slow-Inc` org's
"team work" — kept near-realtime, **without ever hitting GitHub's rate limits**, on Vercel
serverless behind Cloudflare.

A reference implementation exists in a sibling repo (`resume_web`, an Express
"github-cache-server"): it proxies the GitHub REST API per-username with a server-side
`GITHUB_TOKEN`, caches in a local `.cache` dir + an in-memory `Map`, serves stale on error, and
runs a `setInterval` background refresh. **That cache model is dead on Vercel serverless** — no
persistent disk, the in-memory `Map` is wiped on every cold start, and `setInterval` does not run
in a serverless function — so every cold start re-fetches GitHub and rate-limit exposure scales
with traffic. We reuse its authenticated-REST fetch pattern, not its cache model.

Constraints in play:

- **Vercel serverless** (per ADR 0001): no persistent local disk, no reliable long-running timer,
  cold starts wipe in-memory state.
- **GitHub limits:** an authenticated fine-grained PAT is **5,000 req/hr primary**; a **secondary
  limit** (~900 points/min + a concurrency cap) applies regardless; **conditional requests that
  return `304` do not count against the primary limit**.
- **ADR 0001:** keep a separate **Nest.js API layer** — the decision there explicitly *rejected*
  merging backend/data logic into Next.js Route Handlers. `nestjs/` already owns the data layer
  (`database/` + Drizzle + Supabase via the Supavisor transaction pooler on 6543).
- **Cloudflare** fronts the app (domain → Cloudflare → Vercel).

## Decision

Serve the portfolio from a **durable snapshot that only a refresher writes** — user traffic never
calls GitHub.

1. **Store = Supabase** (already in the stack; no new vendor). A `github_snapshots` table of JSONB
   rows keyed by resource (e.g. `repos:<login>`, `org:Slow-Inc`, `languages:<login>/<repo>`), each
   with an `etag` and `updated_at`. Chosen over Upstash Redis / Vercel KV / Cloudflare KV — for
   this read-mostly snapshot the extra KV vendor buys nothing that Supabase + a CDN cache don't.
2. **Placement = `nestjs/src/github/`** (module + controller + service), per ADR 0001 (Nest is the
   API/data layer; the DB layer already lives in nestjs). `nextjs/` **renders** by calling the
   nestjs API — the same browser→nestjs pattern the chat client already uses — and layers its own
   caching (Next ISR / SWR) plus Cloudflare in front. This rides on the nestjs-on-Vercel serverless
   deploy that ADR 0001 already calls for.
3. **Freshness is event-driven where possible, polled where not:**
   - **Org / team work** → a **GitHub org webhook** on `Slow-Inc` (`push`, `repository`, `star`) →
     `POST /github/webhook` (HMAC-verified) → refresh only the changed repo → **< 5 s**.
   - **Personal repos** → a **tiered conditional poll**: the repo *list* per member + org (~7
     `If-None-Match` calls, mostly `304` = free) every **~1 min**; per-repo metadata
     (languages/README) fetched **only for repos whose `pushed_at` changed** (delta), not on a
     blind timer.
4. **Auth = fine-grained PAT (server-only)** for v1 — one token, no member coordination. A
   **GitHub App** (personal-repo webhooks + higher ceiling) is deferred to Phase 2.
5. **Rate-limit safety:** ETag/`304`, `pushed_at` delta, a concurrency cap (≤ 5–10 in-flight),
   **single-flight via `pg_advisory_xact_lock`** (transaction-scoped — session-level advisory locks
   are unreliable through the Supavisor transaction pooler), and backoff on `403`/`429`
   (respect `Retry-After`). **Stale-while-heal:** a read whose snapshot is older than a threshold
   serves the stale snapshot *and* triggers a background refresh — so the cron is a freshness
   optimization, not a single point of failure.
6. **`content/site.ts` becomes curated identity only** (name, handle, role, bio, certs, which repos
   to feature); the live fields (repo list, stars, languages, `pushed_at`) come from the snapshot,
   with `site.ts` as the fallback when a snapshot is missing (e.g. first deploy).

## Consequences

- **Rate limit becomes effectively impossible to hit** from user traffic — only the refresher
  calls GitHub, bounded and conditional.
- **Prerequisite:** the nestjs-on-Vercel serverless setup (ADR 0001, still pending) must land first;
  the github feature deploys on the same backend.
- **Webhook is a security boundary:** verify `X-Hub-Signature-256` against the **raw request body**
  with `crypto.timingSafeEqual` before doing any work (triggers `/security-review`).
- **Next.js 16 caching APIs must be confirmed from the vendored docs** before implementation —
  `fetch` is no longer cached by default, Route Handlers are not auto-cached, and the "SWR at the
  edge" behavior comes from `Cache-Control` honored by Cloudflare (a Cache Rule is required — CF
  does not cache JSON by default), not the Next Data Cache.
- **Known runtime traps to handle:** a `304` returns an empty body (keep prior data, don't
  overwrite); the full/initial refresh (~150 calls) can exceed a serverless `maxDuration` and the
  secondary limit → chunk it and cap concurrency; Supabase Realtime (Phase 2) needs the table in the
  `supabase_realtime` publication + an anon SELECT RLS policy.
- **Realtime live-push (Supabase Realtime → open tabs)** is deferred to Phase 2; v1 freshness for a
  *viewing* user is ISR + client SWR (revalidate-on-focus), ~60 s.

## Alternatives considered

- **Upstash Redis / Vercel KV as the store.** Rejected — a second vendor for a read-mostly snapshot;
  Supabase is already present and a CDN response cache covers hot reads. (A multi-model review first
  favored Upstash, then flipped to Supabase once the "already on Supabase" constraint was weighed.)
- **Cloudflare KV.** Rejected for now — its edge-local read advantage only materializes if serving
  moves to Cloudflare Workers; we serve from Vercel behind CF CDN, so the CF CDN *response* cache is
  the right cache layer, not KV.
- **Put the feature in Next.js Route Handlers.** Rejected — contradicts ADR 0001 (keep the separate
  Nest.js API layer).
- **On-demand fetch + cache like `resume_web`.** Rejected — couples user traffic to GitHub and the
  cache is dead on serverless.
- **GitHub App now.** Deferred to Phase 2 — the coordination cost (each member installs it) isn't
  justified for v1; a PAT + ~1-min personal-repo poll is enough.
- **GitHub GraphQL to collapse ~150 REST calls into ~1.** Deferred — REST + ETag + delta stays well
  under the limits at six-members scale; revisit if the team grows.
