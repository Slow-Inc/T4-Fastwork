# PRD — Epic B: AI display-ranking

> Part of the vision umbrella `2026-07-15-showcase-cms-vision.md`. English doc
> (bilingual applies to the GitHub tracker). Shared decisions D1–D5 live in the
> umbrella; this PRD applies them to ranking.

## Problem

Every public listing today renders its source array in raw/insertion order (proven
by the 2026-07-15 survey): home Featured (`is_featured` filter, no sort), Selected
work (static array), team collaborative work (static array), `/projects`
(`projects-repo.ts` has no `.order()`), blog (`published_at DESC`), certificates
(`sort_order ASC`, renders ALL — no limit). Nothing orders by how much an item earns
a visitor's trust, and the certificate wall shows everything at once.

## Goals

- Order the trust-bearing listings by an AI-assessed rubric so the strongest
  evidence leads.
- Certificates: show the **best 9** with a **"see more"** affordance for the rest.
- Zero per-visitor LLM cost; deterministic, cacheable output.
- Never override a human/admin manual order (D1).

## Non-goals

- Personalised/per-visitor ranking. - Real-time re-ranking on every view.
- Ranking blog *content quality* generation (that's Epic D generate); B ranks
  existing items, using `views` + a content signal.

## Rubric (the LLM prompt)

Score each item 0–100 on, and return a ranked order + one-line rationale:
1. **Impact to customer** — does this evidence a real outcome a prospective client
   cares about?
2. **Credibility** — issuer prestige + verifiability (a `verify_url`, a known org, a
   shipped live product beats a participation cert).
3. **Recency** — newer work/certs weighted up, gently.
4. **Audience relevance** — fit to T4's positioning (SaaS / web / AI product eng).

Blog adds **views** as an explicit signal alongside content. The rubric text is a
constant in the PRD/service so it's tunable in one place; admins can adjust weights
later (Epic C admin surface).

## Architecture (applies D2 + D1)

- **Offline compute, persisted (D2).** A `RankService` runs on the existing GitHub
  refresh cadence (cron) + on-demand admin trigger. It calls `LlmService.complete()`
  once per listing-type with the candidate items, parses a validated JSON ranking,
  and writes a numeric `ai_rank` per row. Reads are a plain `ORDER BY ai_rank`.
- **Purity for tests.** Like `github-generate`, the LLM is an injected client; the
  candidate-building, JSON parsing/validation, and tie-breaking are pure + unit-tested.
- **Human override wins (D1).** A row whose rank owner is `'human'` (admin set a
  manual `sort_order`) is pinned and excluded from AI reordering; AI only orders
  `'auto'` rows, slotted around the pinned ones.
- **Graceful.** No LLM env or a failed call → keep the last persisted `ai_rank` (or
  fall back to the current static order). Never blank, never blocks a deploy.

## Schema

Add to `projects`, `certificates`, `blog_posts`:
- `ai_rank integer` (nullable; lower = higher priority) + `ai_rank_rationale text`.
- Reuse the D1 provenance flag for manual override: a `rank_owner 'auto'|'human'`
  (or reuse existing `sort_order` as the human pin + treat `sort_order != 0` as
  human-owned). Decide in B2; default: separate `ai_rank`, with `sort_order` as the
  human pin that wins.
Migration is additive/nullable → safe on prod (matches the epic #27 migration
discipline). `certificates`/`blog_posts` are Supabase-only tables → Supabase migration.

## Deliverables (issues)

- **B1 — `RankService` + rubric (pure core).** Candidate builder, prompt, JSON
  schema + parser/validator, tie-break, injected `LlmClient`. Unit-tested. No wiring.
- **B2 — Schema + `RankStore`.** Migrations for `ai_rank`(+rationale) + override flag
  on the three tables; Drizzle/Supabase store; provenance rule (D1).
- **B3 — Cron wiring.** Compute ranks on refresh cadence + admin on-demand trigger;
  respect human pins; persist. Graceful degradation.
- **B4 — Read-path ordering.** `getAllProjects`, certificates repo, blog repo
  `ORDER BY` rank; **certificates best-9 + "see more"** UI (today renders all).
- **B5 — Surfaces + e2e.** Apply to home Featured, Selected-work, team collaborative
  work, `/projects`, blog; e2e per surface (order stable, no console errors,
  reduced-motion unaffected).

## Testing

Pure scoring/parse/tie-break unit tests (bun); repo `ORDER BY` unit tests; e2e that
the persisted order renders and the certs "see more" reveals the rest. Verify every
FE change with `bun run e2e` (+ `.next` clear for CSS).

## Risks

- **LLM nondeterminism** → persist + only recompute on data change (readme_sha-style
  gate); pin temperature low; store rationale for auditability.
- **Cost** → one call per listing-type per refresh, not per item/'visitor.
- **Bad ranking** → admin manual pin (D1) always wins; rationale visible in admin.
