# Open-Work Ledger

Single source of open work (tracked + untracked). Newest/most-active on top.
🔴 = untracked (MD-only, no issue). See `t4-agent-memory`.

## Active — Open WebUI-style app-shell for /chat (epic #37)

PRD: `docs/superpowers/specs/2026-07-15-owui-app-shell-chat.md`. Design inputs: `docs/design/openwebui-layout-study.md` + `docs/design/expensive-minimalism.md` + `nextjs/DESIGN.md`. Branch `feat/chat-thinking-mode`. **✅ All phases P0–P5 shipped** (commits `dc0fc3e`, `9af0f0f`, `06189eb`, `5b97857`, `6337f69`, + P4). Issues #38–#43 still OPEN pending confirm-to-close (not self-merged). Remaining: PR + close issues on the user's go.

| Phase | Issue | State | Notes |
|---|---|---|---|
| P0 conversation store (`lib/chat-conversations.ts`, pure, migrate `floating` key) | #38 | ✅ shipped (`dc0fc3e`) | list/create/switch/rename/delete/touch + `groupByRecency` + `migrateFloating` (idempotent) + `deriveTitle`; 23 unit tests. Pure lib — not wired to UI yet (P1). Issue still OPEN pending confirm-to-close |
| P1 `<ChatSidebar>` + two-pane app-shell | #39 | ✅ shipped (`9af0f0f`) | `ChatSidebar` + `ChatAppShell` + store-backed `ChatClient` mode + `chat-relative-time` (8 TDD); mirrors active→`floating` for popup continuity (#31); 45 e2e green; /impeccable pass. Issue OPEN pending confirm-to-close |
| P2 empty-state + suggestions | #40 | ✅ shipped (`9af0f0f`→next) | first-run hero (accent dot + `ผู้ช่วย AI` + tagline) + `⚡ แนะนำ` suggestion ledger (title+subtitle, click sends) replacing the greeting bubble + chips; gated by `emptyState` prop so popup keeps the compact greeting. 46 e2e green. Issue OPEN pending confirm-to-close |
| P3 message actions (copy/regenerate) | #41 | ✅ shipped (next commit) | hover/focus-reveal action row on assistant turns: copy (clipboard + "คัดลอกแล้ว" feedback) + regenerate (last turn; `streamAssistant` refactor resends prior user turn); hidden mid-stream; mobile always-on. 47 e2e green. Issue OPEN pending confirm-to-close |
| P5 top identity strip + user pill | #43 | ✅ shipped (next commit) | slim `ผู้ช่วย AI · T4 Labs` mono strip (hairline underline) at pane top + reopen button relocated into it; user turns render as a subtle right pill (paper-deep + hairline + rounded-lg), assistant stays flat. 48 e2e green. Issue OPEN pending confirm-to-close |
| P4 composer attach + image (subsumes #35) | #42 | ✅ shipped (next commit) | backend: `sanitizeImages` guard (7 TDD) + multimodal `buildChatMessages` (3 TDD) + `ChatMessage.content` union + 12mb body limit; frontend: composer `+` attach → preview/remove → send, images render in user turn, stripped on persist. **Real vision probe passed** (red PNG → model answered "สีแดงครับ"). 49 e2e green + nest build. Subsumes #35. Issue OPEN pending confirm-to-close |

Prereqs shipped: Visible-Grid Swiss redesign (`f45f7e8`, verified live). Style translation rules in the PRD (never OWUI's flat look). Bilingual issues/PRs; TDD; `bun run e2e` every FE change; `/impeccable` every UI edit.

**Follow-up shipped (post-epic, no issue): full assistant Markdown** — `components/chat/chat-markdown.tsx` (react-markdown + remark-gfm + remark-breaks + rehype-highlight): headings, bold/italic/strike, GFM tables, task/nested lists, blockquotes (tint, not side-stripe), safe new-tab links (dark-rust `#a8330f` for AA), inline code, and fenced code blocks with a language chip + copy button + highlight.js theme tuned to our palette. Assistant turns only (user stays a plain pill). 50 e2e green + real-model visual check. `/impeccable` audit fixed link contrast.

## Active — bug: interrupted AI turn (#36) 🔵

Switching popup ↔ /chat mid-stream loses the in-progress reply → blank `ผู้ช่วย AI` turn. Root cause traced (shared `SHARED_CHAT_KEY` sessionStorage + per-instance SSE + no `AbortController`); architectural, pre-existing since #31 — NOT a redesign regression. Detail: scratchpad `issue-chat-switch-bug.md`. Separate from #37; fix independently.

## Active — Serverless-native live freshness (#25)

Design: ADR `docs/adr/0004-serverless-realtime-freshness.md` + spec `docs/superpowers/specs/2026-07-14-serverless-realtime-freshness-design.md`. Branch `feat/25-serverless-realtime-freshness`.

| Phase | State | Notes |
|---|---|---|
| R1 backend heal + single-flight + `POST /github/heal` | ✅ shipped (`2e6ac7b`) | `GithubHealService`, `resolveHealTarget`, wired; 8 tests |
| R4 Next.js `after()` stale-heal trigger on live-surface reads | ✅ shipped | `nextjs/lib/heal.ts` (keys mirror backend `resolveHealTarget`, stale-gate extractors, secret-guarded `postHeal`, `after()`-wired `scheduleHeal`); wired into `getMemberLiveRepos`/`getMemberLiveUser`/`getRepoDetail`; 13 unit tests; 189 nextjs unit + 42 e2e + build green |
| R2 enable Supabase Realtime on `github_snapshots` + anon-SELECT RLS | ✅ shipped (prod) | anon-SELECT RLS already existed (ADR 0003); only added table to `supabase_realtime` publication (migration `enable_realtime_github_snapshots`). `/security-review` passed clean (+ regex-charset hardening `2694c71`). Realtime enforces the existing SELECT RLS → no new exposure; advisors show no `github_snapshots` warning |
| R3 frontend `<LiveSnapshot>` client Realtime subscriber → swap UI (the "double") | ✅ shipped | `lib/live-snapshot.ts` (keys/filter/`tagForKey`/subscribe, 8 tests) + `lib/live-actions.ts` (`updateTag` Server Action — Next 16 read-your-own-writes; `revalidateTag`/route-handler can't do immediate-fresh) + `components/site/live-snapshot.tsx` (graceful: no env/failed WS/empty keys → server snapshot). Wired into team + project pages; 197 unit + 42 e2e + build green |
| R5 wire webhook + cron safety-net to the heal path | ✅ shipped (code) | **Webhook** already reaches the "double" (its `refreshOwner` upsert broadcasts via Realtime since R2) — no change needed. **Cron safety-net** = committed Action `.github/workflows/github-refresh-cron.yml` (hourly POST `/github/refresh`; single-flight + ETag make idle runs cheap). Activates on merge to `master`; gated on Actions secret |

**All #25 code phases (R1–R5) are implemented, tested, committed.** The "double" works end-to-end: idle = zero work · serve stale instantly · heal-on-read (R4→R1) · current viewer gets fresh via Realtime + `updateTag` (R3) · genuinely-new gate (ETag/304) · quiet on leave. See `docs/deploy/realtime-freshness-runbook.md`.

**Merged + deployed:** PR #32 merged to `master` (merge `4d66774`); frontend redeployed to prod (aliased `t4-fastwork-nextjs.vercel.app`, 200). R4 heal-on-read is live.

**Human activation steps (external dashboards):**
1. ✅ **Frontend Vercel env** — `GITHUB_REFRESH_SECRET` set on `t4-fastwork-nextjs` (production, Sensitive) via Vercel CLI + redeploy. See `docs/deploy/vercel-cli.md`.
2. ✅ **Actions secret** — `BACKEND_REFRESH_SECRET` set via `gh secret set`. Cron verified end-to-end (manual dispatch run 29322271919: `POST /github/refresh → HTTP 201`, synced 12 keys, `changed: org:Slow-Inc`). Runs hourly.
3. ✅ **Org webhook** — created on `Slow-Inc` via `gh api` (hook id `652601508`, `POST /github/webhook`, json, push, active). Required an interactive `gh auth refresh -s admin:org_hook` (neither token had the scope). Verified: ping deliveries returned `200 OK` (backend HMAC-verified the secret; a mismatch would be 401). See `docs/deploy/realtime-freshness-runbook.md`.

**🎉 #25 fully activated** — all 3 event sources live: heal-on-read (Vercel env set), hourly cron (Actions secret, verified HTTP 201), org webhook (verified ping 200). The "double" works end-to-end on prod.
- **Known gap (non-blocking):** the webhook's `refreshOwner` re-syncs repo *lists*, not per-repo showcase *detail* (contributors/pulls/readme) — those freshen via the hourly cron + heal-on-read. Acceptable for a safety-net; expand only if push-latency on contributors matters.

## Shipped & closed — Autonomous GitHub project showcase (epic #27, PR #29 merged + deployed)

Design: `docs/superpowers/specs/2026-07-14-github-project-showcase-design.md`. **Status: #27/#28/#30/#31 CLOSED; PR #29 merged (`39d2ed2`) + deployed to prod; migrations `0002_showcase_projects_columns` + `enable_realtime_github_snapshots` applied; RAG re-ingested.** Table below is historical record; only the "Deferred" list under it remains.

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

**Deferred (post-#27, NO open issue — re-file if pursued):**
- P3 autonomous content-gen: `GenerateStore` Drizzle impl + `LlmClient` (`CUSTOM_OPENAI_*`) + refresh-cron wiring + draft-gate approve CMS action.
- **#30 RAG-from-live-GitHub** — chat answers grounded in fresh GitHub data (the stats-fix half shipped; the RAG-freshness half never started).
- P5 co-dev avatars on project cards · P6 iframe preview popup · P8 CMS provenance/approve UI.
- Wire `CurateService`/`GithubDetailService` "tracked repos" from published `projects` rows (currently `GITHUB_SHOWCASE_REPOS` constant).

_(#31 share-conversation popup↔/chat: DONE — `SHARED_CHAT_KEY`, closed. #30 stats-fix: DONE, closed.)_

## Backlog — AI-curated member CMS vision (2026-07-15) — filed as #44–#57

From a product-vision session + a 5-agent system survey (2026-07-15) — full
snapshot with file:line anchors: `docs/reports/2026-07-15-system-state-survey.md`.
Foundation already built (see epic #27 above + memory `showcase-system-already-built`);
these are the confirmed **gaps** the vision (`showcase-vision-2026-07`) still needs.

**Vision PRD:** `docs/superpowers/specs/2026-07-15-showcase-cms-vision.md`. **Issues filed
(bilingual):** Epic A carousel **#44** · Epic B AI-ranking **#45** (B1–B5 **#47–#51**,
PRD `…ai-display-ranking.md`) · Epic C member CMS **#46** (C1–C6 **#52–#57**, PRD
`…member-profile-cms.md`). Sequence **A → B → C**. Details below; ordered roughly by size.

**Progress (branch `feat/chat-thinking-mode`, TDD, all green):**
- ✅ **A #44** shipped (`75da320`) — `teamTechnologies` union + hook-free `TeamTechCarousel` between Hero/Featured; 243 unit + 51 e2e, verified live. Config flag deferred (YAGNI until C admin).
- ✅ **B1 #47** shipped (`8e6637b`) — rank core: `RANK_RUBRIC`/`buildRankMessages`/`parseRanking` (always a permutation of ids, never drops)/`rankCandidates` (injected client); 6 tests.
- ✅ **B2 #48** shipped (`641c7a1`) — `ai_rank`(+rationale) on projects (Drizzle migration `0003_safe_risque`) + certs/blog (`supabase/migrations/0003_ai_rank.sql`, idempotent) + `RankStore` seam + `ranksToRows`. **Migrations now APPLIED to prod** (t4-fastwork `ngpsbetwbhbemcoequoy`): projects via `db:migrate`, certs/blog via Supabase MCP; all 3 tables verified.
- ✅ **B3 #49** shipped (`f7fe48a` + `c7cc04d` scrutinize fix) — `RankService` (graceful) + `PgRankStore` (raw SQL, tx-wrapped) + `RankModule` (binds `LlmService.complete`) + secret-guarded `POST /rank/refresh`. **Verified END-TO-END live**: 201, certs/blog/projects `ai_rank` populated with sensible rationales. `/scrutinize` ran → transaction-atomicity fix applied.
- ✅ **B4 #50** shipped (`db26e5c`) — read-path `ORDER BY ai_rank` in certs/blog/projects repos + `CertificatesView` best-9 + `<details>` see-more (hook-free, unit-tested). **/blog live-verified** ordered by ai_rank.
- ⚠️ **B5 #51 GATED (architectural).** ai_rank only reaches **DB-backed reads**. `/blog` ✅. But home **Featured/Selected-work/team-work read static `content/*`** (not the DB repos), and home **certs** fall back to static image-backed team certs (DB certs have no image), and `/projects` is catalog-first (`mergeProjects`). Making ranking pervasive needs the home surfaces + content moved onto the DB — the **same static→DB migration as Epic C**. Decision needed before B5: migrate content to DB now, or accept ranking on DB-backed surfaces only.

- **AI display-ranking** (NEW — zero exists anywhere; proven by exhaustive survey).
  Rank/order listings by impact-to-customer + credibility via `LlmService.complete()`
  (reuse the `ScopeSummaryService` pattern): certificates (**best 9 + "see more"**;
  today `certificates-view.tsx` renders ALL, no limit), home Featured, home
  Selected-work (`project-gallery.tsx`), team collaborative work
  (`team-section.tsx` `.team-projects`), `/projects` (`projects-repo.ts` has no
  `.order()`), blog by **views + content** (`blog_posts.views` displayed, not
  sorted). Data hooks present: `projects.sort_order` (exists, unused), `is_featured`,
  `blog_posts.views`, GitHub stars. Decide: rank at ingest/cron (write a rank col)
  vs on-read + cache; guard cost + determinism.
- **Member self-service profile CMS** (NEW — biggest piece; needs DB). Today team
  profiles are static `content/site.ts` (`team: TeamMember[]`), no `members` table,
  admin is single-tier (`ADMIN_EMAILS` allowlist, no roles, no per-member scoping).
  Needs: a members/profiles table + per-member Supabase Auth + member-scoped edit UI
  for the **override** fields (profile, which GitHub repos to show, README toggle,
  skills, tech stack) and **additive** fields (certificates, blog articles). Blog
  admin currently has no edit action and no member authoring.
- **Team tech-stack carousel** on home (NEW — "Phase A" quick win). Icon marquee of
  the **union of members' `stack`** (reuse `TechChips`/`tech-logos`), placed between
  Hero and Featured. Interim: derive from static `member.stack`; swap source to the
  members DB later (data shape stable). Note: a prior standalone tech marquee at
  section 05 was removed 2026-07-15 (commit `c639344`) as a duplicate of the filter
  chips — this new one is icon-based + team-sourced + a different purpose.
- **Website iframe-preview popup** — already tracked as "P6 iframe preview popup
  deferred" (showcase section above); confirmed still absent (0 `iframe` in nextjs).

## Tech debt (pre-existing, surfaced this session) 🔴

- **#25 R3 "double" UI-swap has no end-to-end automated test** — the pure seams (`live-snapshot.ts`, `heal.ts`, `resolveHealTarget`) + the `<LiveSnapshot>` mount are unit/e2e covered, but nothing simulates a real Supabase Realtime broadcast → `updateTag` → UI swap. Verified by reasoning + manual only (scrutinize, #25). To close: a component test injecting a fake Realtime client that emits a change and asserts `refreshLiveTags` + `router.refresh` fire (friction: mocking `next/navigation` + the `'use server'` `next/cache` import under bun/happy-dom), or an integration e2e that bumps a snapshot `updated_at` via SQL and asserts the open page updates. No issue yet.


- **nestjs lint ~692 errors on HEAD** — typescript-eslint type-resolution fails across `test/**`. Repo-wide; needs an eslint/tsconfig fix. New source files are clean. No issue yet.
- **`github.service.spec.ts` "omits Authorization when no token" fails locally** — Bun auto-loads `nestjs/.env` (real `GITHUB_TOKEN`); passes in CI + with token unset. Env-dependent test; consider making it hermetic. No issue yet.
- **Supabase advisors: `rls_disabled_in_public` ERROR on ~13 public tables** (faqs, services, projects, categories, tags, technologies, blog_posts, certificates, conversations, messages, project_tags, project_technologies, document_embeddings) + `sensitive_columns_exposed` on `conversations.session_id` — **pre-existing**, surfaced during #25 R2 advisor check (NOT introduced by R2; `github_snapshots` itself is clean). The backend reads these via the Postgres superuser pooler (bypasses RLS), so enabling RLS needs explicit anon policies to avoid breaking public frontend reads. Out of #25 scope; needs its own security pass. No issue yet.

## Carried over from ADR 0003 (epic #16, still open per prior handoff)

- Freshness automation: refresh cron (could be a committed GitHub Action) + org webhook on `Slow-Inc` + Cloudflare cache rule for `/github/*`. Token org-403 was **fixed this session** (fresh ≤366-day PAT set on Vercel + redeployed; refresh syncs org + 5 members).
- Issues #16–#24 still open despite PR #26 merged — close with evidence when the epic wraps.
