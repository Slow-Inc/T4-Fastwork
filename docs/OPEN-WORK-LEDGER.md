# Open-Work Ledger

Single source of open work (tracked + untracked). Newest/most-active on top.
🔴 = untracked (MD-only, no issue). See `t4-agent-memory`.

## Active — Serverless-native live freshness (#25)

Design: ADR `docs/adr/0004-serverless-realtime-freshness.md` + spec `docs/superpowers/specs/2026-07-14-serverless-realtime-freshness-design.md`. Branch `feat/25-serverless-realtime-freshness`.

| Phase | State | Notes |
|---|---|---|
| R1 backend heal + single-flight + `POST /github/heal` | ✅ shipped (`2e6ac7b`) | `GithubHealService`, `resolveHealTarget`, wired; 8 tests |
| R4 Next.js `after()` stale-heal trigger on live-surface reads | ✅ shipped | `nextjs/lib/heal.ts` (keys mirror backend `resolveHealTarget`, stale-gate extractors, secret-guarded `postHeal`, `after()`-wired `scheduleHeal`); wired into `getMemberLiveRepos`/`getMemberLiveUser`/`getRepoDetail`; 13 unit tests; 189 nextjs unit + 42 e2e + build green |
| R2 enable Supabase Realtime on `github_snapshots` + anon-SELECT RLS | ✅ shipped (prod) | anon-SELECT RLS already existed (ADR 0003); only added table to `supabase_realtime` publication (migration `enable_realtime_github_snapshots`). `/security-review` passed clean (+ regex-charset hardening `2694c71`). Realtime enforces the existing SELECT RLS → no new exposure; advisors show no `github_snapshots` warning |
| R3 frontend `<LiveSnapshot>` client Realtime subscriber → swap UI (the "double") | ✅ shipped | `lib/live-snapshot.ts` (keys/filter/`tagForKey`/subscribe, 8 tests) + `lib/live-actions.ts` (`updateTag` Server Action — Next 16 read-your-own-writes; `revalidateTag`/route-handler can't do immediate-fresh) + `components/site/live-snapshot.tsx` (graceful: no env/failed WS/empty keys → server snapshot). Wired into team + project pages; 197 unit + 42 e2e + build green |
| R5 wire webhook + cron safety-net to the heal path | 🔴 next | org webhook = human step; cron + webhook→heal wiring is code |

**Gated deploy step (R4):** set `GITHUB_REFRESH_SECRET` on the **frontend** Vercel project (same value as the nestjs project's `GITHUB_REFRESH_SECRET`). Unset = heal is a silent no-op (pages still serve stale data). Added to `nextjs/.env.example`.

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

**All showcase phases P1–P8 are implemented, tested, and on PR #29** (nestjs 112 pass, nextjs 176 unit, e2e 42). What remains is NOT feature code — only the gated prod steps below and a few explicitly-deferred sub-items (P3 `GenerateStore`/LLM wiring + draft-approve CMS action, P5 co-dev avatars, P6 iframe preview popup, P8 CMS provenance UI).

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
- **Supabase advisors: `rls_disabled_in_public` ERROR on ~13 public tables** (faqs, services, projects, categories, tags, technologies, blog_posts, certificates, conversations, messages, project_tags, project_technologies, document_embeddings) + `sensitive_columns_exposed` on `conversations.session_id` — **pre-existing**, surfaced during #25 R2 advisor check (NOT introduced by R2; `github_snapshots` itself is clean). The backend reads these via the Postgres superuser pooler (bypasses RLS), so enabling RLS needs explicit anon policies to avoid breaking public frontend reads. Out of #25 scope; needs its own security pass. No issue yet.

## Carried over from ADR 0003 (epic #16, still open per prior handoff)

- Freshness automation: refresh cron (could be a committed GitHub Action) + org webhook on `Slow-Inc` + Cloudflare cache rule for `/github/*`. Token org-403 was **fixed this session** (fresh ≤366-day PAT set on Vercel + redeployed; refresh syncs org + 5 members).
- Issues #16–#24 still open despite PR #26 merged — close with evidence when the epic wraps.
