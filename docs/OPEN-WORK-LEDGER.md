# Open-Work Ledger

Single source of open work (tracked + untracked). Newest/most-active on top.
🔴 = untracked (MD-only, no issue). See `t4-agent-memory`.

## Active — Autonomous GitHub project showcase (epic #27, PR #29)

Design: `docs/superpowers/specs/2026-07-14-github-project-showcase-design.md`. Branch `feat/27-github-project-showcase`.

| Phase | Issue | State | Notes |
|---|---|---|---|
| P1 sync (contributors/PRs/README/profile) | #28 | ✅ shipped (PR #29) | `GithubDetailService` + config + tests |
| P2 projects table + CurateService | #27 | ✅ code shipped (PR #29) | migration `0002` **NOT yet applied to prod** (gated) |
| P3 ContentGenerateService (LLM, delta, guardrails, draft gate) | — 🔴 | not started | needs a `ProjectDraftStore`/generate store impl + `CUSTOM_OPENAI_*` |
| P4 screenshot worker (GitHub Action + og:image) | — 🔴 | not started | Playwright in CI, not serverless |
| P5 `/projects` merge + labels + clear mockup | — 🔴 | not started | extend `projects-repo.ts` + `project-map.ts` |
| P6 `/projects/[slug]` detail | — 🔴 | not started | Requirement §4.3 |
| P7 `/team/[slug]` + `/about` avatar + profile README | — 🔴 | not started | |
| P8 Home realness + CMS provenance UI | — 🔴 | not started | reuse cert popup + team section + tech carousel |

**Gated deploy steps (need developer / careful apply):**
- Apply Drizzle migration `0002_clumsy_deathstrike.sql` to prod Supabase (`bun run db:migrate` with `DATABASE_URL`). Additive-only, safe, but touches prod.
- Wire `CurateService`/`GithubDetailService` into the refresh cron (which repos are "tracked" comes from published `projects` rows).

## Active — AI chat corrections

| Item | Issue | State |
|---|---|---|
| Chat RAG answers from live GitHub data + fix inflated stats (site uses correct 5yr/21+; wrong 20yr/500 likely in nestjs chat system-prompt/RAG seed) | #30 | filed, not started |
| Share conversation between floating popup and `/chat` AI page (history continuity) | #31 | filed, not started |

## Tech debt (pre-existing, surfaced this session) 🔴

- **nestjs lint ~692 errors on HEAD** — typescript-eslint type-resolution fails across `test/**`. Repo-wide; needs an eslint/tsconfig fix. New source files are clean. No issue yet.
- **`github.service.spec.ts` "omits Authorization when no token" fails locally** — Bun auto-loads `nestjs/.env` (real `GITHUB_TOKEN`); passes in CI + with token unset. Env-dependent test; consider making it hermetic. No issue yet.

## Carried over from ADR 0003 (epic #16, still open per prior handoff)

- Freshness automation: refresh cron (could be a committed GitHub Action) + org webhook on `Slow-Inc` + Cloudflare cache rule for `/github/*`. Token org-403 was **fixed this session** (fresh ≤366-day PAT set on Vercel + redeployed; refresh syncs org + 5 members).
- Issues #16–#24 still open despite PR #26 merged — close with evidence when the epic wraps.
