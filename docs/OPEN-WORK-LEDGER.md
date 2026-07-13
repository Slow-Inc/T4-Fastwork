# Open-Work Ledger

Single source of open work (tracked + untracked). Newest/most-active on top.
🔴 = untracked (MD-only, no issue). See `t4-agent-memory`.

## Active — Autonomous GitHub project showcase (epic #27, PR #29)

Design: `docs/superpowers/specs/2026-07-14-github-project-showcase-design.md`. Branch `feat/27-github-project-showcase`.

| Phase | Issue | State | Notes |
|---|---|---|---|
| P1 sync (contributors/PRs/README/profile) | #28 | ✅ shipped (PR #29) | `GithubDetailService` + config + 8 tests |
| P2 projects table + CurateService | #27 | ✅ code shipped (PR #29) | migration `0002` **NOT yet applied to prod** (gated); 9 tests |
| P3 ContentGenerateService (LLM, delta, guardrails, reconcile) | #27 | ✅ **logic shipped** (PR #29) | pure reconcile + tech-guard + delta, 5 tests. **Remaining:** `GenerateStore` Drizzle impl + `LlmClient` (`CUSTOM_OPENAI_*`) + cron wiring + draft-gate approve action |
| P6/P7 backend read layer | #27 | ✅ shipped (PR #29) | `/repos/:o/:r/detail` + `/users/:login` endpoints + 5 tests |
| P6 contributor classification (frontend logic) | #27 | ✅ shipped (PR #29) | `lib/contributors.ts` merged+pending / team+external, 4 tests |
| P4 screenshot worker (GitHub Action + og:image) | #27 | ✅ shipped (PR #29) | workflow + script + tested extractOgImage; gated on Actions secrets |
| P5 `/projects` list labels | #27 | ✅ shipped (PR #29) | owner chip on cards + DB gh mapping; co-dev avatars deferred |
| P6 `/projects/[slug]` page | #27 | ✅ shipped (PR #29) | owner chip + contributors + README render; e2e. (preview popup deferred) |
| P7 `/team/[slug]` avatar + profile README | #27 | ✅ shipped (PR #29) | GitHub avatar + native profile README (markdown renderer); e2e |
| P8 Home realness | #27 | ✅ shipped (PR #29) | team section + tech marquee on home; cert popup already reuses lightbox. (CMS provenance/approve UI deferred) |

**Backend + core logic of the epic is DONE and tested (P1–P3, read layer, contributor classify).** Remaining is the UI rendering layer (P5–P8 pages/components + mandatory `bun run e2e`) and the gated deploy steps below.

**Gated deploy steps (need developer / careful apply):**
- Apply Drizzle migration `0002_clumsy_deathstrike.sql` to prod Supabase (`bun run db:migrate` with `DATABASE_URL`). Additive-only, safe, but touches prod.
- Wire `CurateService`/`GithubDetailService` into the refresh cron (which repos are "tracked" comes from published `projects` rows).

## Active — AI chat corrections

| Item | Issue | State |
|---|---|---|
| Chat inflated stats — **DONE** (`system-prompt.ts` `TEAM_FACTS` pins 5yr/21+, forbids invention). RAG-from-live-GitHub part **remains** | #30 | ✅ stats fixed (PR #29); RAG-freshness not started |
| Share conversation between floating popup and `/chat` AI page (history continuity) | #31 | filed, not started |

## Tech debt (pre-existing, surfaced this session) 🔴

- **nestjs lint ~692 errors on HEAD** — typescript-eslint type-resolution fails across `test/**`. Repo-wide; needs an eslint/tsconfig fix. New source files are clean. No issue yet.
- **`github.service.spec.ts` "omits Authorization when no token" fails locally** — Bun auto-loads `nestjs/.env` (real `GITHUB_TOKEN`); passes in CI + with token unset. Env-dependent test; consider making it hermetic. No issue yet.

## Carried over from ADR 0003 (epic #16, still open per prior handoff)

- Freshness automation: refresh cron (could be a committed GitHub Action) + org webhook on `Slow-Inc` + Cloudflare cache rule for `/github/*`. Token org-403 was **fixed this session** (fresh ≤366-day PAT set on Vercel + redeployed; refresh syncs org + 5 members).
- Issues #16–#24 still open despite PR #26 merged — close with evidence when the epic wraps.
