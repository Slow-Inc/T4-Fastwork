# Open-Work Ledger

Single source of open work (tracked + untracked). Newest/most-active on top.
🔴 = untracked (MD-only, no issue). See `t4-agent-memory`.

## ✅ 2026-07-18 (AFK run) — domain-cutover SEO fix shipped; #92 rank/sync leg parked

- **`#97`/`#98` SHIPPED + merged (`db3b6d5`):** `chore(seo)` — the `NEXT_PUBLIC_SITE_URL`
  **fallback default** still pointed at legacy `t4labs.co` after the domain move. Swapped the
  fallback in `nextjs/app/{layout,sitemap,robots}` + `.env.example` + the screenshot Action
  `SITE_URL` default → `https://t4labs.dev`. Prod/local set the env explicitly so real traffic
  was unaffected; this fixes the env-unset paths (fresh checkout / CI / screenshot Action, which
  would else screenshot the old domain). New `app/site-url.test.ts` deletes the env then
  dynamic-imports robots/sitemap to exercise the fallback (red→green). **310 unit + 52 e2e +
  eslint + tsc green.** Left intentionally: nestjs CORS legacy origin, `admin-auth.test.ts` email
  fixtures (email domain parked). No security boundary touched.
- **`#92` — rank/sync revalidation leg SHIPPED (`#99`, `38445d0`; dev present, approved):** new
  non-boundary `nestjs/src/revalidate/` (`postProjectRevalidation` pure + 4 tests; `RevalidateService`
  fail-soft, reuses `FRONTEND_ORIGIN`[0] + shared `GITHUB_REFRESH_SECRET`). Wired fire-and-forget into
  `/rank/refresh` (after `refreshAll`) + `/github/refresh` (on a changed sync, beside #60 re-ingest) —
  secret check + `Unauthorized` still precede the call. 217 nestjs tests + build + eslint + DI boot
  (`DI_OK`) + `/security-review` (auth-gated, secret app-to-app, no SSRF/DoS, fail-soft). **#92 stays
  open** only for **prod-confirm** (a live rank/sync write reflecting on t4labs.dev). #62 P6 caveat: rank
  reorder surfaces once `/projects` reads DB (#69); the sync leg benefits now.
- **`www.t4labs.dev` — DONE:** added to Vercel project (`verified:true`); CF `A www → 76.76.21.21`
  grey → cert issued → proxied (orange), SSL Full. Live `https://www.t4labs.dev` → 200. Serves the site
  (not a 301→apex); canonical → apex via `NEXT_PUBLIC_SITE_URL`, so no duplicate-content. See
  [[domain-migration-t4labs-dev]].
- **Standing feedback captured:** *check env from `.env.example`/`.env` yourself, don't ask* →
  [[check-env-example-dont-ask]].
- Tree green on `master`. Everything else open is `ready-for-human` (#66–#71 P3–P8, #75, #81) + #92 (prod-confirm).

## ✅ 2026-07-17 (evening, interactive) — MangaDock screenshot pipeline works end-to-end

- **Job A done:** developer set the Actions secrets (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
  `BACKEND_REFRESH_SECRET`). Screenshot worker debugged live over 3 rounds:
  - `#89` — goto `networkidle` → `domcontentloaded` (live app never idles → timeout).
  - `#90` — default HeadlessChrome UA got flagged (Cloudflare) → real Chrome UA + status logging.
  - `#91` — migration `0021`: create the `project-shots` Storage bucket (was missing → `Bucket not
    found`). Public read, no write policy (worker uploads under the secret key). Applied via MCP.
  - **Result:** `mangadock` captured → `project-shots/mangadock.jpg`; `projects.snapshot_image` +
    `live_url=hayateotsu.space` verified in prod. Cron runs every 6h for the rest.
- **Supabase new key format adopted** (#84/#86/#87 + docs): frontend already on
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; screenshot worker → `SUPABASE_SECRET_KEY` (URL reused from
  the public one, no dup); dropped dead legacy `SUPABASE_ANON_KEY`. Backend runtime uses only
  `DATABASE_URL` (no API key).
- **`#92` filed (the real last-mile):** live `/projects` still serves the pre-write ISR cache — public
  reads revalidate *on demand from admin Server Actions only* (`public-db.ts`), so a CI/cron writer
  (screenshot, rank, sync) never busts the cache. Sustainable fix = on-write revalidation trigger, not a
  manual redeploy. This is audit #0/#17 systemic; overlaps P6.
- **`#92` Option A shipped (`#93`, `344d65e`):** `POST /api/revalidate` — fail-closed, constant-time
  secret (reuses `GITHUB_REFRESH_SECRET`), revalidates only public project paths, no data returned;
  auth+target logic in the unit-tested `lib/revalidate` seam (9 tests); screenshot worker POSTs it after
  a capture; workflow passes `SITE_URL` + `BACKEND_REFRESH_SECRET`. 308 unit + build + **e2e 52/52** +
  `/security-review` + `/scrutinize` green; Vercel preview built READY (deployable confirmed), prod
  deploy in flight. **Open until:** prod page-refresh confirmed post-deploy + rank/sync wired to the
  endpoint (trivial follow-up). *(Built after the developer corrected the over-asking pattern — see
  [[dont-re-ask-whats-decided]]: acted on the brief's Option A recommendation instead of re-asking.)*

- **AFK run (evening): both `ready-for-agent` items parked — nothing safely executable unattended.**
  - `#92` — wrote the decision brief `docs/reports/2026-07-17-cache-revalidation-options-92.md`
    (3 options; recommend A: secret-guarded revalidate Route Handler reusing the refresh secret).
    Code parked: A/B/C is an architecture/caching-policy call + A is a security-boundary endpoint +
    end-to-end verify needs prod cache observation. **Needs: dev picks a shape → then TDD build.**
  - `#81` — parked: the store side writes a real DB and there is no isolated test DB, so it can't be
    verified unattended. **Needs: a test DB (or dev present) to build+verify.**
  - Everything else open is `ready-for-human` (#66–#71 P3–P8, #75). Tree green on `master`.

## ✅ 2026-07-17 (night AFK) — P1 + P2 core shipped

- **P1 `#64` (CLOSED, merged `#80`):** migration `0020` (blog_posts case-study cols + `project_documents`
  + `generation_jobs`, RLS) applied to prod (advisors clean); Drizzle `nestjs/src/database/schema/showcase.ts`.
- **P2 `#65` core (CLOSED, merged `#83` squash `229d841`):** new pure module
  `nestjs/src/github/github-case-study.ts` — map-reduce over a repo's MD, sized for the 128K gateway
  (ADR 0009 D2). Stage0 curate · Stage1 map + `parseFileExtract` · `selectDocsToMap` (blob_sha cache,
  **path-identity**) · Stage2 `AUDIENCE_PERSONAS`/reduce ×3 · `mapRepoMetadata` (audit #17 homepageUrl→live_url)
  · `runMapReduce`. TDD 7 slices; **32 module / 205 nestjs tests + `nest build` green**; all LLM calls injected,
  **not wired to any controller yet (inert)**.
- **Adversarial review paid off:** a codex `/code-review` on the actual diff found **3 real defects** —
  blob_sha-vs-path identity collision (major), a dead `meta` param, whitespace-only required fields — all
  verified against code + fixed in slice 7 with regression tests.
- **Filed:** **#81** (P2 persistence — wire `runMapReduce` → DB + real LLM: extract cache, 3 `blog_posts`
  case_study rows, `live_url`, `generation_jobs` idempotency; overlaps P3). **#82** (pre-existing repo-wide
  `bun run lint` fail in `github-write.controller.ts` — a type-assertion bind; unrelated to P2, CI has no
  lint gate so it didn't block).
- **Epic #62:** P0/P1/P2 ticked.
- **`#82` (CLOSED, merged `#84`):** unbroke repo-wide `bun run lint` (exit 1→0) — a redundant
  `RefreshSummary` assertion in `github-write.controller.ts` (type-only; auth path untouched).
- **`#81` adapter (partial, merged `#85`):** `github-case-study-client.ts` `createCaseStudyLlmClient` —
  binds the pure map-reduce to `LlmService.complete`, unit-tested end-to-end with a fake `complete`.
  **`#81` stays open** for the `PgGenerateStore` DB side (read `project_documents` → write 3 `blog_posts`
  case_study rows + extract cache + `live_url` + `generation_jobs`) — **deferred: no isolated test DB**, so
  the real DB writes can't be verified unattended; do it with a test DB / the developer (overlaps P3 #66).
- **NEXT buildable:** #81 store side (needs test-DB/developer to verify) → P3 `#66` (needs the GitHub App
  installed — developer manual step). All remaining P2/P3 progress now gates on the developer.

## ✅ 2026-07-17 (late) — shipped to master + retro-review recovery

- **Merged to master:** `#72` (P0 status-leak fix + MangaDock overlay/live_url + the whole
  clear-backlog batch — feat was branched off `chore/clear-backlog-afk`, so the squash carried it all),
  `#76` (#7 — overlay the DB snapshot on the detail page too), `#77` (**#73** — chat cross-conversation
  persistence corruption, fixed via a pure `applyPersist` seam + TDD). All e2e 52/52.
- **Process miss caught + corrected:** `#72` was merged with `/scrutinize` scoped to only my 4 files
  and no `/code-review`. A **retroactive `/code-review`** (codex) on the real 49-file diff then found
  **7 issues** — filed **#73** (fixed), **#74** (RAG ingest non-atomic), **#75** (content-gen correctness
  ×3); #4 = audit #8. Lesson in [[pre-merge-review-discipline]]: gate on the ACTUAL merge diff; don't PR
  a feature branched off an unmerged branch. #76/#77 both went via PR (not self-merged).
- **MangaDock:** repo `homepageUrl=https://hayateotsu.space/` (the real dev-phase site; `mangadock.com`
  is a parked domain) → corrected `live_url` (static + DB); screenshot capture teed up (Action cron once
  its secrets are set). New audit **finding #17**: sync never captures repo `homepageUrl`/`openGraphImageUrl`.
- **Retro-review findings all handled:** **#73** fixed (#77) · **#74** RAG-ingest atomic-replace fixed
  (#78) · **#75** part 3 (reject partial-JSON) fixed (#79) — parts 1 (apply-regenerates → design, P4/#67)
  + 2 (applyPatch owner predicate — latent DB-race) remain in #75. `#59`/`#58` (clear-backlog) closed as
  merged-via-#72.
- **Everything autonomously-doable is shipped + gated** (TDD red→green, /scrutinize, PR-not-self-merge).
  **All remaining open work needs the developer:** epic #62 + #64–#71 (P1–P8) are design-pending on the
  4 questions in `docs/reports/2026-07-17-adr0009-open-questions-brief.md`; set the screenshot Action
  secrets for MangaDock; decide #75 parts 1/2.

## 🚧 NEXT (design done, build pending) — GitHub-sourced AI case studies + site-wide static→DB sweep

**One program, three inputs consolidated 2026-07-17:**
- **Decision** → [ADR 0009](adr/0009-github-sourced-ai-authored-case-studies.md) — kill the static
  catalog; projects+blog become GitHub-sourced native AI case studies (3 audience variants:
  business/semitech/developer), map-reduce generation over MD (blob-sha extract cache, sized for the
  `qwen3.6-35b-a3b` 128K gateway), webhook+cron+per-file-SHA trigger + GitHub App, revisions+overrides
  provenance, per-project chat via the existing **FR-09 deterministic** grounding (Requirement.MD §5.5).
- **PRD** → `docs/superpowers/specs/2026-07-17-github-ai-case-studies.md` — phases **P0–P8** (each → an
  issue). **Design must stay faithful to Requirement.MD** (§4.2/§4.3/§5.1/§5.5/§6); the redesign is
  additive.
- **Audit** → `docs/reports/2026-07-17-static-db-disconnect-audit.md` — the MangaDock screenshot bug is
  **systemic**: the public site renders static `content/*.ts` while every write pipeline writes
  Supabase. **16 disconnects** found — **all 16 verified** against the code (audit was 100% accurate). So "kill static"
  must be a **site-wide sweep**, not just projects/blog.

**Tracked (filed 2026-07-17): epic #62 + children #63–#71 (P0–P8).** Branch `feat/github-ai-case-studies`.

**Overnight AFK 2026-07-17 (done on branch, pushed, NOT merged):**
- **#63 P0 — DONE** (`52fd7c5`): `.eq('status','published')` on the 3 public project reads. Verified:
  read-only prod proof (would_be_hidden=0), tsc clean, unit 5/5, **e2e 52/52**. Red-first unit was not
  feasible (no test DB) → verified via e2e + SQL semantics; a negative integration test is a follow-up.
- **MangaDock (audit #0) — DONE** (`9821b9a`): `mergeProjects` overlays the DB `snapshotImage` onto the
  static card (ADR 0003 pattern; TDD 7/7); `live_url` corrected `mangadock.com`(parked)→`hayateotsu.space`
  (the repo's `homepageUrl`) in static catalog + prod DB. Screenshot capture teed up (Action cron, once
  its Actions secrets are set). **New audit finding #17**: sync never captures repo `homepageUrl`/`openGraphImageUrl`.
- **Decision brief** (`71a31d7`): `docs/reports/2026-07-17-adr0009-open-questions-brief.md` — 4 decisions
  that unblock #64–#71.

Remaining (needs the developer): merge the branch (P0 + MangaDock) after review; answer the 4 open
questions to move #64–#71 → `ready-for-agent`; set the screenshot Action secrets so MangaDock captures.
- **#63 P0** — see above (done on branch, pending merge).
- **#64–#71 P1–P8** — schema · map-reduce generator · trigger+GitHub App · provenance revisions/
  overrides · safety gate · **static→DB sweep (all surfaces)** · RAG+native render · per-project FR-09
  chat. All parked-for-design (open questions: 1 URL vs 3, deep-dive marker, member-repo eligibility,
  schema shape).
- **Static→DB sweep surfaces** (#69, audit): projects, blog, faqs, services, certificates, recommend,
  sitemap, member projects/certificates, RAG ingest source, chat marker resolver.
- **Immediate quick-win option** (not yet an issue): overlay DB `snapshot_image` onto static cards +
  fix mangadock DB `live_url` (→ `mangadock.com`) so the screenshot shows before the full cutover.

## ✅ Session 2026-07-16/17 — clear-backlog program

Branch `chore/clear-backlog-afk` (PR #59). What shipped this session:
- **Close-outs:** #16–24 (freshness epic), #33/#35/#37/#38–43 (chat epic) CLOSED with
  subagent-verified evidence; #20 superseded by #25. Tracker down to #58 (this PR).
- **Security (Phase 1):** migration `0018_rls_chat_rag_tables.sql` — RLS + grant-trim on
  `conversations`/`messages`/`document_embeddings` (were reachable via public PostgREST).
  Applied to prod + committed; JWT-sim + advisors + codex adversarial review all green.
  Sensitive specifics + 3 codex follow-up findings live in the private security note.
- **Bug #36 FIXED** (`3256504`): loop-owned persistence (`lib/chat-stream.ts` pure reducer
  + `persistDirect`) so a mid-stream reply survives a popup↔/chat switch; 290 unit + 52 e2e
  green; closed with a post-mortem.
- **Epic B (#45/#51) CLOSED:** all 5 surfaces verified rendering in `ai_rank` order (audit,
  file:line). The optional project-CONTENT→DB migration is a future epic (zero functional gap).
- **Security follow-ups fixed:** `app_admins` reconcile/prune of de-provisioned admins
  (`a1296be`, closes the codex HIGH stale-admin + MED split-brain); `github_snapshots` RLS
  policy backfilled into a migration (`12c5f7d`, migration 0019). pg_default_acl deny-by-default
  is a LOW posture decision left for the team (private note).
- **Phase 4 SHIPPED + CLOSED:** **#61** P3 content-gen (LlmClient adapter + `PgGenerateStore`
  + secret-guarded `POST /github/generate` dry-run, `66b3bb1`) + **#60** RAG-freshness
  (`runIngest` extraction + `RagIngestService` single-flight + refresh-trigger, `3401f5d`).
  Verified: 170 nestjs tests + build + app bootstrap + live endpoint smoke (201 / 401).
- **Research:** subagent difficulty-ladder (R0–R3) + delegation log → xeno-skills.

**Tracker now: only #58 (this PR).** 🔴 **Optional follow-ups (not blockers):** #61 category-FK/M2M
persistence + context-auto-assembly + approve RPC/UI + cron; #60 per-project incremental re-ingest;
pg_default_acl deny-by-default posture; project-CONTENT→DB migration. All documented in
`docs/reports/2026-07-17-p3-content-gen-rag-freshness-plan.md` + the private security note.

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

## Active — bug: interrupted AI turn (#36) 🔵 — PARKED (architecture decision) 2026-07-16

Switching popup ↔ /chat mid-stream loses the in-progress reply → blank `ผู้ช่วย AI` turn. Architectural, pre-existing since #31 — NOT a redesign regression. Separate from #37; fix independently.

**Fail path traced (2026-07-16, debug-mantra), file:line:**
- `send()` (`components/chat/chat-client.tsx:186`) pushes `{role:"assistant", parts:[]}` then calls `streamAssistant`.
- `streamAssistant` (`chat-client.tsx:249`) runs an async `reader.read()` loop that writes tokens into **instance-local React state** via `mutateLastAssistant` (`:171`).
- Persistence is a **React effect** on `messages` change (`:368`) → store (`onPersist`) + `SHARED_CHAT_KEY` sessionStorage (`chat-app-shell.tsx:116`).
- On surface switch the streaming instance unmounts → `setMessages` becomes a no-op → the persist **effect stops firing** → tokens streamed after unmount never reach the store. The other instance seeds once from the last snapshot (`chat-app-shell.tsx:170` / `chat-client.tsx:352`), which still holds the **empty** assistant turn → permanent blank turn. (The async loop itself keeps running post-unmount, but its writes are dropped.)

**Why PARKED (AFK):** the faithful fix ("reply survives the switch") is a **seam/architecture decision** — where the streaming loop lives and how it persists independent of React mount:
1. **Loop-owned persistence** — `streamAssistant` keeps a local accumulator and writes each update straight to the store + `SHARED_CHAT_KEY` (not via the effect), so the completed reply lands even after unmount. Eventual-consistent: the other surface shows it on next mount, not live. *(smallest; recommended first)*
2. **Module-singleton stream** — hoist the SSE loop out of the component into a per-conversation singleton; instances subscribe. True live cross-surface sync. *(largest)*
3. **AbortController + persist-on-unmount** — abort on unmount and flush the partial. Cleanest teardown but the reply is cut short, not continued.

Recommend (1) as MVP; validate with an e2e that starts a turn, switches popup↔/chat mid-stream, and asserts the reply survives + finishes. Do this as a focused interactive step (seam choice), not blind AFK. Do **not** ship a "strip the empty turn" half-fix — it hides the blank artifact while the reply is still lost.

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

## ✅ MERGED — AI-curated member CMS vision (2026-07-15) — PR #34 → `master` (`c8a131f`)

**Epics A/B/C + chat app-shell (#37–#43) MERGED to `master` 2026-07-15 via PR #34.**
Issues **#44, #46–#50, #52–#57 CLOSED** (delivered + verified + merged). Still **OPEN:
#45 (Epic B) + #51 (B5)** — the only remainder is the larger, parity-sensitive
**project-content → DB** migration (M2M tech/tags, tone + description_en cols, category
reconcile); AI ranking already works with content static. Pre-merge `/scrutinize` +
`/security-review` found + fixed 3 real issues (admin-action authz, no-RLS direct writes,
blog view/rank gaming) — see commits `149623d`, `f9aeda5` + migrations 0015–0017.
**Human follow-up:** flag other teammates `is_admin` at `/admin/members` (only `xenodev`
bootstrapped); optional `ADMIN_EMAILS` + `seed-app-admins.ts` for the email fallback.

The detail below is the historical build log (all shipped + merged).

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
- ✅ **C-foundation** shipped (`3d07704`) — certs/projects/team-work migrated static→DB.
  3 Drizzle tables (`member-content.ts`, migration 0006, applied): `member_projects`
  (+`selected` for C3), `member_certificates` (+`status` draft|published for C4),
  `team_projects` (collaborative, contributors[]); all carry `ai_rank`(+rationale) for
  B5. RLS (supabase 0007, applied): anon SELECT scoped so drafts/unselected hidden.
  Seed `seed-member-content.ts`: 17 projects / 10 certs / 4 team — counts match static
  exactly. Pure mappers `member-content-map.ts` (7 TDD). Repos `member-content-repo.ts`
  (getMemberProjects/Certificates(slug), getTeamProjects) DB-first+fallback.
- ✅ **C3 #54 remainder** shipped — **project-selection** (`310093a`): member ticks which
  repos show (member_projects.selected); RLS own-row + column-grant (selected/sort_order
  only); verified live (xenodev deselect orangecat → dropped from /team → restored).
  **README toggle** (`75c6158`): wired readme_visible to actually gate the public README
  (was a no-op); TeamMember.readmeVisible; unit-tested show/hide. README-content override
  deferred.
- ✅ **C4 #55 core** shipped — **C4a cert authoring** (`cd345ed`): member adds own certs,
  RLS forces status='draft', column-grant withholds status (can't self-publish — verified
  by adversarial JWL sim); ImageUpload to `media`. Verified live: add→draft→hidden→
  approve→visible→delete. **C4b admin approve** (`1f8d4ed`): app_admins + is_app_admin()
  (SECURITY DEFINER, JWT email) + admin_set_member_certificate_status RPC (bypasses member
  column-grant, admin-gated — verified by JWT sim: admin publishes, non-admin blocked);
  admin approvals queue UI. Gate: set ADMIN_EMAILS + run seed-app-admins.ts.
  **Deferred:** member blog authoring (blog_posts needs author_id + RLS, blast radius),
  admin edit actions for blog/certs.
- ✅ **Unified admin auth** shipped (`ed54906`) — admin = a member flagged
  `members.is_admin` (GitHub login, same as members); email/password + ADMIN_EMAILS kept
  as break-glass fallback (user choice). `getAdminSession()` (member.is_admin OR email);
  admin login has a GitHub button; members roster has an Admin toggle (RPC gated by
  is_app_admin, which now also honours member.is_admin). xenodev bootstrapped as admin.
  **VERIFIED END-TO-END live**: xenodev reached /admin (no redirect), toggled a teammate's
  admin flag, and approved a draft cert through the real /admin/approvals button →
  published on /team. Makes the whole admin CMS self-verifiable via the xenodev session.
- 🔒 **Security fix** (`c49a32f`) — `isAllowedAdmin` now **fails closed** on an empty
  ADMIN_EMAILS (was: admit ALL authenticated — exploitable once members can GitHub-login,
  any member could reach /admin). User-approved. **ACTION REQUIRED: set ADMIN_EMAILS** in
  nextjs/.env.local + Vercel or /admin is inaccessible.
- ✅ **C5 #56** shipped (`9b791f2`) — `/team/[slug]` + home/about team-section read DB.
  `member-map.ts` mapDbMember (3 TDD); members-repo getTeamMembers()/getMemberBySlug()
  (attaches projects/certs). Page uses them, `dynamicParams=false→true`. team-section
  split server-fetch/client-locale/presentational (team-section{,-client,-view}.tsx).
  **DB path proven live** (sentinel member_projects row appeared on /team/xenodev then
  removed). Fix: anon needed SELECT on `members.id` for PostgREST FK embeds (serial PK,
  not sensitive; security-review columns stay withheld). 260 unit + 52 e2e green.
- ✅ **A #44** shipped (`75da320`) — `teamTechnologies` union + hook-free `TeamTechCarousel` between Hero/Featured; 243 unit + 51 e2e, verified live. Config flag deferred (YAGNI until C admin).
- ✅ **B1 #47** shipped (`8e6637b`) — rank core: `RANK_RUBRIC`/`buildRankMessages`/`parseRanking` (always a permutation of ids, never drops)/`rankCandidates` (injected client); 6 tests.
- ✅ **B2 #48** shipped (`641c7a1`) — `ai_rank`(+rationale) on projects (Drizzle migration `0003_safe_risque`) + certs/blog (`supabase/migrations/0003_ai_rank.sql`, idempotent) + `RankStore` seam + `ranksToRows`. **Migrations now APPLIED to prod** (t4-fastwork `ngpsbetwbhbemcoequoy`): projects via `db:migrate`, certs/blog via Supabase MCP; all 3 tables verified.
- ✅ **B3 #49** shipped (`f7fe48a` + `c7cc04d` scrutinize fix) — `RankService` (graceful) + `PgRankStore` (raw SQL, tx-wrapped) + `RankModule` (binds `LlmService.complete`) + secret-guarded `POST /rank/refresh`. **Verified END-TO-END live**: 201, certs/blog/projects `ai_rank` populated with sensible rationales. `/scrutinize` ran → transaction-atomicity fix applied.
- ✅ **B4 #50** shipped (`db26e5c`) — read-path `ORDER BY ai_rank` in certs/blog/projects repos + `CertificatesView` best-9 + `<details>` see-more (hook-free, unit-tested). **/blog live-verified** ordered by ai_rank.
- ✅ **C1 #52 (core)** shipped (`4ed106a`) — `members` table (Drizzle migration 0004, applied) + `seed-members.ts` (6 members migrated, slugs match `teamSlug`) + anon read grant + `members-repo.getTeamTechnologies()` (DB-first) + carousel now **DB-sourced** (proven via a sentinel tech added in the DB → appeared live → reset). Deferred: /team + team-section still read static (rest of C1/C5); certs/projects relations.
- ✅ **C3 #54 (core) DONE + verified end-to-end** (`6afa591` + fix `184c7da`) — the logged-in Playwright session (xenodev) exercised the real write: edit skills/stack/README → Save → persisted, RLS allowed own-row only, `stack_owner` flipped to 'human' (trigger). A live-test caught + fixed a **comma-in-tech data bug** (`Cloudflare (CDN, DNS, Tunnel)` was shredded by comma-splitting → now newline-separated, `<textarea>`). Note: member flows ARE self-verifiable now (the Playwright browser holds the member session).
- ✅ **C3 #54 (core)** shipped (`6afa591`) — member self-edit of skills / tech stack / README-visibility at `/member` (`MemberProfileForm`). DB: RLS "edit own row" + **column-scoped UPDATE grant (skills/stack/readme_visible only)** + a trigger flipping `*_owner` → 'human' (D1). Security self-review caught + fixed a MEDIUM: Supabase's default table-level UPDATE grant to `authenticated` made the column-scope moot (member could edit role/handle/owners) → revoked table UPDATE, verified scope. Stack edits re-feed the home carousel (already DB-sourced). 249 unit + 52 e2e green. **Write-test = the logged-in member (xenodev).** Deferred (C3 remainder): project-selection from GitHub repos + README-content override (need certs/projects migrated to member-scoped tables — the C4/C5 foundation).
- ✅ **C2 #53 DONE** (`ce4bc5e`) — full GitHub-login flow (`/member/login` → `signInWithOAuth` → `/auth/callback` + `link_current_member()` → `/member` via `getCurrentMember()`, scoped by `auth_user_id`) + members RLS (public column-scoped read; SECURITY DEFINER link is the only write path). **`/security-review` found + fixed 2**: HIGH account-takeover (spoofable `user_metadata` → GoTrue `auth.identities`) + LOW column exposure. **Round-trip VERIFIED with a real human login**: xenodeve → xenodev member row linked (`auth_user_id` set). 247 unit + 52 e2e green. **Unblocks C3 (member edit UI) / C4 (additive) / C6 (admin).**
- 🟡 **C2 #53 foundation** shipped (`d365c39`) — OAuth app registered by the user + Supabase GitHub provider **verified enabled** (`auth/v1/settings → github:true`, "allow users without email" on). `members.github_login` (matched instead of handle/email — they differ) + `members.auth_user_id` (Drizzle migration 0005, applied; github_login backfilled) + pure `githubLoginFromUser()` (3 tests). **Remaining C2 (security-critical, verify-blocked):** `signInWithOAuth` trigger + `/auth/callback` route + member linking + `getCurrentMember` scoping + **RLS on members** (SELECT public; UPDATE self via `auth_user_id = auth.uid()` + a claim policy for the first-login link — has a chicken-and-egg to design carefully). Needs `/security-review` AND **a human GitHub login to verify the round-trip** (can't be self-verified) → do as a focused collaborative step, not blind AFK. C3/C4/C6 depend on this.
- ✅ **C6 #57** shipped (`(members+approvals)`) — admin **approval queue** (`/admin/approvals`, from C4b:
  member draft certs → approve/unpublish via the RPC) + read-only **Team/Members roster**
  (`/admin/members`). Admin UI not Playwright-verifiable (no admin creds); routes compile +
  fail-closed guard redirects (307). Member-edit is self-service; admin oversees + approves.
- ✅ **AFK run 2 — remaining deferred items ALL shipped** (all verified end-to-end via the
  now-unified admin/member Playwright session; TDD; nextjs 272 unit + 52 e2e green):
  - **C4d** admin **edit** actions for blog + certs (`[id]/edit` routes mirroring projects;
    blog edit preserves original published_at). Verified via xenodev admin UI.
  - **C4c** member **blog authoring** — blog_posts += author_id + RLS (member drafts,
    published_at-null-gated so can't self-publish; anon reads published — closes a draft
    leak; admin is_app_admin). `lib/slugify.ts` (5 TDD). Admin approvals gained a blog
    section. Verified: member draft → hidden → admin publish → on /blog; pure-member
    self-publish BLOCKED by RLS.
  - **C3 README-content override** — members.readme_override; member writes custom
    markdown → renders on /team over the GitHub README. Verified live.
  - **Website iframe-preview popup** — `WebsitePreview` sandboxed-iframe overlay + fallback
    on project detail (deferred #27 item). Verified live (framing-blocked sites degrade to
    the fallback).
  - **B5 full** (`c4b9021`) — home **Featured + Selected-work + /projects** now AI-rank
    ordered. Seeded 8 catalog projects as DB rank-holders (`supabase/0014`); `orderByRank`
    (4 TDD) drives the order while CONTENT stays the static catalog (zero parity risk).
    Verified: parity at null rank, then all 3 surfaces reorder to a test ai_rank. **Deferred
    (larger, parity-sensitive):** moving project CONTENT into DB (M2M tech/tags, tone +
    description_en cols, category reconcile).
- 🟡 **B5 #51 PARTIAL** (`8f3b1d5`) — ranking now reaches **team_projects** (home/about
  collaborative work): rank job extended (`RankKind`+='team_projects', store adapter),
  `getTeamProjects` orders by ai_rank-first (no admin pin). **Verified live** (set ai_rank →
  /about reordered → reset). `/blog` + certs/projects DB reads already ranked (B4).
  **Still gated (large):** home **Featured/Selected-work** read the static projects CATALOG
  (`content/catalog`), not DB — ranking them needs a catalog static→DB migration (separate
  epic). Member per-profile cert/project ranking skipped (marginal, small lists).
- ⚠️ **B5 (historical note) GATED (architectural).** ai_rank only reaches **DB-backed reads**. `/blog` ✅. But home **Featured/Selected-work/team-work read static `content/*`** (not the DB repos), and home **certs** fall back to static image-backed team certs (DB certs have no image), and `/projects` is catalog-first (`mergeProjects`). Making ranking pervasive needs the home surfaces + content moved onto the DB — the **same static→DB migration as Epic C**. Decision needed before B5: migrate content to DB now, or accept ranking on DB-backed surfaces only.

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
- **RLS security pass — RE-SCOPED (verified on prod 2026-07-16).** Earlier notes listed a broad set of public tables as `rls_disabled_in_public`; a direct check on prod confirms the **content tables now have RLS enabled + policies** — the member-CMS security work (PR #34, migrations 0015–0017) already covered them. A **small remaining set of chat/RAG tables** still needs a scoped RLS pass; the backend reaches them via the superuser pooler (bypasses RLS), so the pass must add scoped policies without breaking chat. The exact tables/columns + prod project ref are kept in the **private security note (personal memory)**, not this public ledger. This is **Phase 1** of the clear-backlog program — its own security pass (grill vs ADR 0007 → `/security-review`). No issue yet.

## ✅ CLOSED — ADR 0003 live-team-portfolio epic (#16) + all sub-issues (2026-07-16)

Freshness epic **#16 + #17–#24 CLOSED** as completed-with-evidence after a subagent
code-audit against `master` (Explore Task subagents, per-deliverable `file:line`) +
a prod DB RLS check. #18's `github_snapshots` RLS confirmed **live on prod** (rls_enabled,
1 policy — but applied directly, **not in a committed migration**: a migration-drift item to
backfill). **#20 closed as superseded by #25** — its route/single-flight/ETag repo-list sync
ship + live (cron HTTP 201), but the WARM-tier `pushed_at`-delta poll was never built and is
covered by #25's event-driven cron+heal+webhook+Realtime architecture (YAGNI). The chat
app-shell epic **#37 + #38–43** and **#33/#35** also closed (all verified vs `master`).
- **Follow-up (🔴 no issue):** backfill the `github_snapshots` RLS policy into a committed
  migration so a rebuilt DB reproduces it (prod is fine; the repo migration set is incomplete).
