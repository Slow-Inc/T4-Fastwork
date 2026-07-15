# ADR 0008 — AI display-ranking: content keeps its source; only the display ORDER comes from a persisted `ai_rank`

**Status**: Accepted · 2026-07-15 · merged to `master` (PR #34, `c8a131f`)
**Relates to**: [ADR 0005](0005-member-content-to-db-provenance-additive.md) (content in DB) · Epic B #45 (#47–#51)
**Spec**: `docs/superpowers/specs/2026-07-15-ai-display-ranking.md`

## Context

The vision wants listings ordered by **impact-to-customer + credibility** via the LLM:
certificates (best 9 + "see more"), blog (by views + content), home Featured, home
Selected-work, `/projects`, and the team's collaborative work. Two questions: **when** to
compute the ranking (it is an LLM call — cost + determinism matter), and **where the ranked
content lives** (some of it — the projects catalog — is still static, ADR 0005's deferred part).

## Decision

**Rank offline, persist a per-row `ai_rank`, and let read paths order by it — while each
listing keeps its existing content source.** The LLM decides ORDER, not content.

- **Rank at ingest/refresh, not on read (D2)**: `nestjs/src/rank/*` — a pure core
  (`rank.ts`: `buildRankMessages` / `parseRanking`, which always returns a permutation of the
  ids, never dropping one), `RankService` (graceful — a flaky gateway never wipes a good
  order), `PgRankStore` (raw SQL, tx-wrapped), behind a secret-guarded `POST /rank/refresh`.
  It writes `ai_rank` (+ rationale) columns on projects/certificates/blog/team_projects.
- **Human pin wins (D1)**: read paths order by `sort_order` (the human pin) then `ai_rank`
  nulls-last for the member/cert lists; blog and team-work — which have no human pin — lead
  with `ai_rank`.
- **Content stays its source; only order is DB-driven**: rather than migrate the static
  projects *catalog* (`content/catalog.ts`) into the DB — which carries real parity risk
  (M2M tech/tags, hash-derived `tone`, `description_en`, category reconcile, a bespoke
  Selected-work mosaic) — the 8 catalog projects are seeded into `projects` as **rank-holders**
  (migration `0014`), and a pure `orderByRank(items, slug→ai_rank)` (`lib/project-rank.ts`,
  4 TDD) reorders the **static** catalog for Featured / Selected-work / `/projects`.
  `getProjectRankMap()` feeds the home page. Zero content/visual regression.

Key commits: `8e6637b`/`641c7a1`/`f7fe48a`/`db26e5c` (B1–B4 rank core + read), `8f3b1d5`
(team_projects), `c4b9021` (Featured/Selected/list order). Migrations `0003`/`0014`.

## Consequences

- Ranking reaches every DB-backed listing (blog, certs, projects, team-work) and — via
  rank-holders + `orderByRank` — the home Featured/Selected-work/`/projects` **without**
  moving their content into the DB. Verified live: setting `ai_rank` reordered all three
  surfaces; content unchanged; adding a real row flipped the count instantly.
- The ranking is **dormant until `POST /rank/refresh` runs** (backend + LLM gateway); the
  order falls back to `sort_order`/seed order until then. Cost + determinism are bounded by
  running offline (cron), never per-request.
- **Deferred (#45/#51)**: moving the projects catalog *content* into the DB so the admin CMS
  fully owns projects — a larger, parity-sensitive follow-up, **not** needed for ranking.

## Alternatives considered

- **Rank on read + cache** — rejected: an LLM call in the request path is slow, costly, and
  non-deterministic per view. Offline-computed + persisted is stable and cache-free.
- **Migrate the catalog content into the DB now, then read+rank from DB** — rejected for this
  ADR: high blast radius + visual parity risk (tone/i18n/category/mosaic) for low added value
  over ranking the static content in place. Left as the documented deferred work.
