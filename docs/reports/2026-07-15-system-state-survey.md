# System-State Survey — T4 Fastwork

> **Purpose:** a durable snapshot of what actually exists in this codebase, so a
> future session does not have to re-survey from scratch. If the anchors below no
> longer match, re-verify the areas that changed (`git log <sha>..HEAD`).

## Provenance (staleness anchors)

- **Captured:** 2026-07-15 13:49 SEAST (SESSION Asia/Bangkok, UTC+7)
- **Branch:** `feat/chat-thinking-mode`
- **HEAD:** `c639344` — _fix(home): drop the duplicate tech-stack marquee in section 05_ (25 commits ahead of `master`)
- **Method:** 5 parallel read-only survey agents (GitHub pipeline · AI/RAG+ranking · admin CMS · public data layer + DB schema · team/profile + home surfaces). Every claim below traces to a `file:line`.
- **Cross-check:** `docs/OPEN-WORK-LEDGER.md` is the accurate source of open work and already tracked most of this (esp. epic #27 + its Deferred list); this report adds file-level anchors + the newly-identified gaps.
- **Re-verify first if HEAD moved in:** `nestjs/src/github/*`, `nextjs/app/admin/**`, `nextjs/lib/*-repo.ts`, `nestjs/src/database/schema/*`, `nextjs/content/site.ts`.

---

## TL;DR — three tiers

- **WIRED & live:** admin CMS (9 sections), GitHub snapshot sync (cron+webhook+heal), **real Playwright screenshot** cover images, chat SSE + RAG (pgvector) + embeddings + ingestion, DB-first public reads with static fallback.
- **BUILT but UNWIRED:** `github-curate.ts` (P2) + `github-generate.ts` (P3) — pure, unit-tested, bound to no module/cron/route.
- **GENUINE GAPS:** AI display-ranking (none anywhere), member self-service profile CMS (team is static, no `members` table), website iframe-preview popup, team tech-stack carousel.

---

## 1. Backend GitHub pipeline (`nestjs/src/github/`)

**Wired half (fully end-to-end):** ETag-aware fetch + snapshot sync (`github.service.ts:41,81`), per-repo/user detail (`github-detail.service.ts:26,39`), refresh orchestration (`github-refresh.service.ts:43,111`), stale-while-heal single-flight (`github-heal.service.ts:30`), HMAC webhook (`github-webhook.service.ts:24`, verify `webhook-verify.ts:14`), read API (`github.controller.ts:18`), secret-guarded write API (`github-write.controller.ts:30`), Drizzle store over `github_snapshots` (`drizzle-snapshot.store.ts:20`). Config `github.config.ts:9` (`GITHUB_ORG='Slow-Inc'`, 5 members, `GITHUB_SHOWCASE_REPOS`).

**Triggers (all live):** hourly cron `POST /github/refresh` (`.github/workflows/github-refresh-cron.yml`), push webhook `POST /github/webhook`, heal-on-read `POST /github/heal` from Next `after()`.

**Unwired half (built, tested, executes nowhere — absent from `github.module.ts:28`):**
- `github-curate.ts:67,114,124` — pure eligibility rules + `repoToDraftProject` → draft `projects` row (`source='github'`, all `*_owner='auto'`).
- `github-generate.ts:102` — `ContentGenerateService`: LLM writes TH/EN copy; `reconcile` (`:68`) only patches fields whose owner is `'auto'` (human edits never clobbered); `validateTechnologies` (`:89`); README-SHA delta-gate (`:119`). `LlmClient` is an injected fn type (`:61`) with no production binding to `LlmService`.
- `og-image.ts:28` — cheap `og:image` extractor, **unwired** (the screenshot job is the wired cover path).

**Cover image (WIRED, separate path):** `nextjs/scripts/screenshot-projects.ts:12,39` launches **Playwright Chromium**, screenshots each published `live_url` (1280×800@2x JPEG), uploads to Supabase Storage `project-shots`, writes `projects.snapshot_image` (`:57-74`). Runs via `screenshot-projects.yml` (every 6h), NOT in the Vercel serverless path.

**Remaining to wire the auto-content pipeline** (per ledger Deferred): `GenerateStore` Drizzle impl + bind `LlmClient`→`LlmService` (`CUSTOM_OPENAI_*`) + cron + draft-approve CMS action. `approved_at` column exists (`schema/content.ts:79`) but the approve action isn't built.

## 2. AI / LLM / RAG (`nestjs/src/{chat,rag,llm,ingestion}`)

- **Chat SSE** — `chat.controller.ts:44` `POST /chat/stream` → `chat.service.ts:33` → `llm.service.ts:74`; SSE events session/reasoning/token/card/done/error. Live.
- **RAG** — real pgvector: `rag/drizzle-retrieval.service.ts:31` bound in `chat.module.ts:27` (the stub `retrieval.service.ts:17` is unused). Cosine over `document_embeddings`, `TOP_K=5`, `THRESHOLD=0.5`.
- **Embeddings** — `ingestion/embedding.service.ts:12`, Jina `jina-embeddings-v3` (1024-dim).
- **Ingestion** — `ingestion/ingest.ts` (`bun run db:ingest`); only `status='published'` projects feed RAG (`:24-27`).
- **LLM infra** — single client `llm/llm.service.ts:52` over OpenAI-compatible gateway; env `CUSTOM_OPENAI_API_KEY/_API_BASE`, model `CUSTOM_OPENAI_MODEL ?? 'qwen3.6-35b-a3b'` (`:55`). Surface: `streamChat()` (`:74`) + `complete()` (`:90`). A new ranking call reuses `complete()` (same pattern as `chat/scope-summary.service.ts`).

## 3. Admin CMS (`nextjs/app/admin/**`)

9 `(dash)` sections: Overview (read stats), **Projects** (full CRUD+publish, `projects/actions.ts:20,51,82`), Certificates (create+delete, `certificates/actions.ts:17,41`), Blog (create+delete+publish, `blog/actions.ts:20,48`), FAQs (C/D), Services (C/D), Taxonomy (C/D over categories/technologies/tags, allowlist-guarded `taxonomy/actions.ts:7`), Leads (read), Conversations (read). **Only Projects has an edit form** (`projects/[id]/edit/`); the rest are create+delete only (edit = delete+recreate). Publish = nullable `published_at`.

**Auth/roles:** Supabase email/pw (`login/login-form.tsx:19`); dash layout gates on `isAllowedAdmin(email, ADMIN_EMAILS)` (`(dash)/layout.tsx:26`, `lib/admin-auth.ts:6`). **Single-tier, no RBAC.** ⚠️ empty `ADMIN_EMAILS` admits any authed user (`admin-auth.ts:16`). No root `middleware.ts` guard (only the layout server component).

**No member self-service, no team/members admin section** — nav has no team/members entry (`(dash)/layout.tsx:9-19`); no per-member auth or ownership scoping anywhere.

## 4. Data layer + DB schema

**Drizzle tables** (`nestjs/src/database/schema/*.ts`, migrations `nestjs/drizzle/*.sql`): `categories`, `technologies`, `tags`, `projects`, `project_technologies`, `project_tags`, `services`, `faqs`, `conversations`, `messages`, `document_embeddings` (vector(1024) HNSW/cosine), `github_snapshots` (key PK, data jsonb, etag, pushed_at).

**`projects` is provenance-rich** (`schema/content.ts:36`): `snapshot_image` (:45), `live_url` (:48), `is_featured` (:49), `published_at` (:50), `sort_order` (:51, **exists but never ordered-by**), `source` `'cms'|'github'` (:56), `status` (:57), `gh_owner/gh_repo/gh_html_url/owner_type/owner_login` (:60-64), **7 `*_owner` columns** `'auto'|'human'` (:68-74), `readme_sha/generated_at/approved_at` (:77-79).

**Supabase-only (no Drizzle model):** `blog_posts` (has **`views`** + `published_at`, `blog-repo.ts:31`), `certificates` (`sort_order`, `certificates-repo.ts:20`), `cta_clicks`. **No `members`/`team`/`profiles`/`users` table anywhere** (grep-confirmed).

**Public reads = DB-first with static fallback** (`try/catch` → static `content/*` when Supabase env unset; `public-db.ts:9`):
- `/projects` — DB-first `getAllProjects()` then `mergeProjects(staticCatalog, db)` (`projects-repo.ts:20`, `project-map.ts:66`); **no `.order()`**.
- project detail — static-first, DB for unknown slugs (`projects-repo.ts:35`).
- `/blog` — DB-first `published_at DESC` (`blog-repo.ts:33,39`).
- `/team/[slug]` — **STATIC** `content/site.ts` `team` (`dynamicParams=false`) + live GitHub overlay.
- home — mostly static; **only `<Certificates>` hits DB** (`components/site/certificates.tsx:5`).

**Realtime** — `lib/live-snapshot.ts:95` subscribes to `github_snapshots` postgres_changes → `refreshLiveTags` server action → `updateTag` (the #25 "double").

## 5. Team/profile + home surfaces + website popup

- **Website popup: NONE.** grep `iframe` across `nextjs/` = 0. `live_url` is only a plain external link (`project-detail-content.tsx:107`, `project-card.tsx:51`). The only modal is the internal cert lightbox (`cert-lightbox-home.tsx`).
- **Home listing surfaces — all static insertion order, no ranking:** Featured = 3 (`featured-carousel.tsx:6`, `filterProjects({featured:true})`); Selected work = 4 (`project-gallery.tsx:18`, static `content/projects.ts`); team collaborative work exists in `team-section.tsx:43-66` `.team-projects` (static `content/site.ts:529` `teamProjects`); certificates "Certified, and still learning." renders **ALL** rows, **no limit / no see-more** (`certificates-view.tsx:29`), DB-sourced via `getCertificates()`.
- **Team member profile** (`team-member-view.tsx`): 01 Profile (static + live avatar) · GitHub profile README (live, conditional, `:75`) · 02 Skills (static) · 03 Tech stack (static `member.stack` via `TechChips`, `:97-103`) · 04 Projects (static + live star overlay) · 05 Certificates (static). `member.stack` is static `content/site.ts` (`:157,180,200,319,361,442`), rendered with `lib/tech-logos` icons + text fallback.

---

## Confirmed gaps (build targets)

1. **AI display-ranking** — zero exists (proven by exhaustive term search across the repo). Infra ready (`LlmService.complete()`); data hooks present (`projects.sort_order` unused, `is_featured`, `blog_posts.views`, GitHub stars). Wanted: certs best-9 + see-more, Featured, Selected-work, team-work, `/projects`, blog by views+content — ranked by impact + credibility.
2. **Member self-service profile CMS** — needs a `members` table + per-member auth + member-scoped edit UI (override fields + additive certs/blog). Today: static `content/site.ts`, single-tier admin.
3. **Website iframe-preview popup** — absent (already deferred, ledger).
4. **Team tech-stack carousel** on home — absent (interim "Phase A" can derive from static `member.stack`).

See `docs/OPEN-WORK-LEDGER.md` → "Backlog — AI-curated member CMS vision (2026-07-15)" and memory `showcase-system-already-built` + `showcase-vision-2026-07`.
