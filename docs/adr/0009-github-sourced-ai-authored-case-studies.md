# ADR 0009 — GitHub-sourced, AI-authored native case studies: kill the static catalog; project → per-audience posts; map-reduce generation on MD change

**Status**: Accepted (design) · 2026-07-17 · impl pending
**Relates to**: extends [ADR 0003](0003-github-live-team-portfolio.md) (live GitHub portfolio) and **supersedes its "GitHub App deferred to Phase 2" + "`content/site.ts`/catalog stays curated" positions** · completes the deferred catalog→DB migration from [ADR 0005](0005-member-content-to-db-provenance-additive.md) (§Consequences, #45/#51) · display order stays [ADR 0008](0008-ai-display-ranking-order-not-content.md) · auth/RLS unchanged ([ADR 0006](0006-unified-github-auth-member-is-admin.md)/[0007](0007-db-enforced-authz-rls-is-app-admin.md))
**Spec**: `docs/superpowers/specs/2026-07-17-github-ai-case-studies.md`

## Context

The `/projects` list is assembled in `nextjs/lib/projects-repo.ts:44` from a **hardcoded static
TypeScript catalog** (`nextjs/content/catalog.ts`) as the base, merged with DB `projects` rows
(new slugs only, `project-map.ts:66`) and reordered by `ai_rank` (ADR 0008). Blog is the same
pattern (`nextjs/lib/blog-repo.ts:33`, static `content/blog.ts`). GitHub sync writes a **separate**
`github_snapshots` table (`nestjs/src/github/drizzle-snapshot.store.ts`) that feeds live
stars/README on detail pages — it does **not** populate the projects list. So today the shop window
is still hand-authored TypeScript.

The product vision has hardened (memory `showcase-vision-2026-07`): the portfolio must **sell the
team's work to customers** — small businesses / SMEs and companies hiring per-project — and be
**100% AI-automated**: a developer pushing code that adds/removes/changes Markdown should cause the
public case study to be (re)written with no manual authoring step. No content hardcoded in the repo.

Foundations already exist and are reused, not rebuilt: the AI content-gen wiring
(`github-generate.ts`, `github-generate-client.ts`, `pg-generate.store.ts`,
`github-generate.controller.ts` — `POST /github/generate`, secret-guarded, dry-run default,
`readmeSha` delta-gating, per-field `auto|human` reconcile), HMAC-verified webhooks
(`github-webhook.service.ts`), durable ETag snapshots, and RAG re-ingest (`rag-ingest.service.ts`,
single-flight). Three gaps block the vision: (a) generation is grounded in a **single README
string** passed by the caller, not the repo's full Markdown set; (b) the webhook only refreshes an
owner's repo *list*, it does not drive generation; (c) personal (member) repos have no push
webhook — ADR 0003 deferred the GitHub App and polls them instead.

This design was pressure-tested via a 3-agent `clink-brainstorm` round (codex `gpt-5.6-sol`/high,
antigravity `Gemini 3.1 Pro`, local qwen); all three independently agreed on the load-bearing
choices below (separate entities, webhook+cron+per-file-SHA, seed-then-cutover), and codex surfaced
the concurrency/security/GitHub-App points folded in here.

## Decision

Make GitHub (+ Supabase for non-GitHub extras) the **only** source of portfolio content; render a
project as a **native, AI-authored case study** produced by a map-reduce pipeline over the repo's
Markdown, keyed and gated by per-file blob SHAs.

### D1 — Data model: `Project` and `BlogPost` stay separate; a project has N per-audience posts

Keep `projects` as repository/portfolio **identity** (taxonomy, media, `live_url`, GitHub
coordinates, `ai_rank`, the existing per-field `*_owner` provenance for *facts*). Do **not** unify
Project and BlogPost — they have different lifecycles, and blog is absent from the RAG pipeline
(`chunking.ts` `sourceType: 'project'|'service'|'faq'`, no blog) so unifying would force a schema
merge that buys nothing.

A project maps to **one canonical case study, rendered in three audience variants** (the customer
tiers the user requires) — not one post per `.md` file (dev docs like `CONTRIBUTING.md` are source
material, not editorial units; one-post-per-file yields thin, off-message posts and makes file
deletion break public URLs). New tables/columns:

- **`project_documents`** — the per-file MD manifest: `(project_id, path)` PK, `blob_sha`,
  `content_hash`, `markdown`, `last_seen_commit`, `deleted_at`. Only current default-branch,
  non-excluded `.md` participate in generation.
- **`blog_posts`** (bring under the Drizzle schema — today it is Supabase-only, absent from
  `content.ts`): add `project_id` FK (nullable — a manual editorial post has none), `audience`
  ∈ `business | semitech | developer`, `kind` ∈ `case_study | deep_dive | manual`,
  `source` ∈ `github | cms`. Partial-unique `(project_id, audience)` where `kind='case_study'`
  → exactly one live case study per project per audience (3 rows). `deep_dive` is **opt-in**
  (a repo file explicitly marked, e.g. `CASE-STUDY.md`), not automatic-per-file.
- **`blog_post_revisions`** — immutable AI output: `manifest_hash`, `prompt_version`, `model`,
  `content`, safety result, timestamps.
- **`blog_post_overrides`** — field-level human overrides: editor, timestamp, value.
- **`generation_jobs`** — unique `(project_id, manifest_hash, prompt_version)`; status/attempts/
  error/input-commit for idempotent, at-least-once processing.
- **`document_embeddings.sourceType`** += `'blog'` — wire the case studies into RAG so the chat can
  answer about them (add `chunkBlog()`).

### D2 — Generation: map-reduce over the MD set, sized for the `qwen3.6-35b-a3b` 128K gateway

The generator (`CUSTOM_OPENAI_MODEL=qwen3.6-35b-a3b`, `gateway.9arm.co`, 128K context) must handle a
large MD corpus (e.g. MangaDock: architecture, cache system, AI-dev methodology across many files)
without blowing context. Concatenating every `.md` into one prompt does not scale. Use **map-reduce
with a blob-SHA-keyed extract cache**:

1. **Curate** — filter `project_documents` by include/exclude globs (drop `CHANGELOG`, `LICENSE`,
   `.github/` templates, `node_modules`) → candidate set.
2. **Map** — one LLM call per file → a compact structured extract
   `{themes[], architecture, tech[], user_outcomes, code_depth}`. A single file always fits 128K.
   **Cache each extract keyed by `blob_sha`** so an unchanged file is never re-mapped.
3. **Reduce ×3** — feed *all* extracts (compact; ~50 files × ~500 tok ≈ 25K, well under 128K) plus
   the audience persona → write the case study for `business` / `semitech` / `developer`. If a repo
   is so large the extract set nears budget, add a second hierarchical reduce tier (degrades safely).

This makes 100%-automation **cheap and idempotent**: on push, only changed-SHA files re-map;
unchanged files reuse cached extracts; reduce (3 small calls) re-runs. Extends
`buildGeneratePrompt`/`GenerateContext` from a single `readme` string to the extract set; the
automated worker calls `ContentGenerateService` directly (no HTTP self-call); `POST /github/generate`
stays the operator dry-run/retry endpoint.

### D3 — Trigger: webhook-first + cron reconcile, per-file SHA manifest, GitHub App for member repos

- **GitHub App** installed on the `Slow-Inc` org **and each member account** — this **supersedes ADR
  0003's PAT-only + personal-repo-polling** decision, which cannot deliver immediate member-repo
  pushes (the vision requires syncing each member's repos live).
- On a default-branch `push`: HMAC-verify, dedupe the delivery, **enqueue `{owner,repo,after}` and
  return 202** — no tree walk or LLM in the request. A worker fetches the tree at `after`, rebuilds
  the `project_documents` manifest of `{path, blob_sha}` (detects add/modify/remove/force-push more
  reliably than trusting `commits[].added/removed`), hashes it with `prompt_version`, and **skips the
  LLM entirely if the manifest hash equals the last successful generation**.
- **Promote atomically only if the job's manifest is still the project's latest** — so a slow older
  job never overwrites a newer push. On failure keep the last published revision.
- **Cron reconcile** (existing refresh path, wiring in the unwired `CurateService`) is the safety net
  for missed deliveries; replace the single `readme_sha` gate with `input_manifest_hash`.

### D4 — Provenance: immutable AI revisions + human overrides (replaces mutable owner for generated copy)

The existing mutable `*_owner='human'` model **conflicts with continuous regeneration**: the first
human edit permanently freezes that field from future AI updates, which contradicts "regenerate on
every MD change". For AI-authored case-study copy, use **immutable generated revisions + field-level
human overrides**, rendering `override ?? latest_generated`. Keep the existing per-field `auto|human`
provenance on `projects` for *facts/taxonomy* (title, description, tech, tags) where a one-time human
correction *should* stick. Additive/manual editorial posts keep the ADR 0005 draft→approve gate.

### D5 — Kill the static catalog safely, as a site-wide sweep (no blank `/projects`)

The static catalog is today's fallback safety net (`projects-repo.ts:52`, `blog-repo.ts:42`); remove
the *source*, not the resilience. **Scope note:** the
[static↔DB disconnect audit](../reports/2026-07-17-static-db-disconnect-audit.md) shows the
static-vs-DB split is **not limited to projects/blog** — the same gap silently breaks FAQ, services,
home Featured, `/recommend`, the sitemap, certificate `is_featured`, and member project/cert ranking
(16 findings). So "kill static" is a **repo-wide sweep** across every `content/*.ts` surface, each with
its own parity gate; the trigger case (the MangaDock screenshot never reaching a static-rendered card)
is finding #0. Order (per surface):

1. **Prerequisite fix** — the read predicate filters only `published_at` (`projects-repo.ts:51`), not
   `status`; a `draft`/`hidden` GitHub row with a set `published_at` would leak public. Add
   `status='published'` to the read + an E2E regression **before** any auto-generation goes live.
2. Complete DB parity mapping (`mapDbProject` omits `descriptionEn`, `videoUrl`, gallery, taxonomy).
3. Seed every static project + blog row into the DB (`source='cms'`), transactionally.
4. Parity gate: `static_slugs △ db_slugs = ∅`, plus localized fields/media/taxonomy/featured order,
   across **all** consumers (home `app/page.tsx`, `/projects/[slug]`, `sitemap.ts`, recommendations,
   chat cards) — not just `/projects`. Full E2E/visual parity.
5. Two-deploy cutover: deploy DB-only reads that serve a **last-known-good snapshot with
   `stale-if-error`** (never replace a good list with an empty result), keep static one release for
   rollback, then delete `content/catalog.ts` + `content/blog.ts` + the fallback branches.

### D6 — Per-project chat: reuse the existing FR-09 **deterministic** grounding (Requirement.MD §5.5), not project-filtered RAG

Requirement.MD **§5.5 (FR-09)** already specifies "ถามรายละเอียดผลงานนี้กับ AI" and its non-negotiable
design rule, which governs this redesign: grounding for a single-project question is **deterministic,
not semantic** — the backend pulls the **full project row by exact slug** and injects it as a
**system-prompt block, separate from RAG**, precisely so embedding search never surfaces a *different,
similar* project instead of the one the visitor is viewing. This mechanism is **already built** and
must be reused, not replaced:

- `formatProjectContext` (`nestjs/src/chat/project-context.ts`) — formats the full record as the
  deterministic block; `buildProjectGreetingMessage` (`nextjs/lib/project-chat.ts`) — the auto opening
  question; flow is `/chat?project=<slug>` with a "กำลังคุยเกี่ยวกับผลงาน: {title}" banner (client hook
  in a Suspense boundary, keeps `/chat` static).

Therefore this design **does not** add `project_id`-filtered vector retrieval (that contradicts FR-09).
It **extends** the existing path: enrich `ProjectContextRecord`/`formatProjectContext` to include the
**generated case-study narrative** (and, when useful, the top MD extracts from D2) so the deterministic
block is richer; keep RAG for **cross-cutting** context only (services/FAQ/pricing, "similar work").
The per-project chat is the *same* streaming chat component embedded on the case-study page in FR-09
project mode. (P7's `chunkBlog` adds case studies to the **global** `/chat` RAG per §5.1 — that is a
separate concern from the deterministic per-project grounding here.)

## Consequences

- Portfolio content becomes fully GitHub+DB-sourced and self-updating; a push that changes MD
  rewrites the customer-facing case study within one webhook round-trip, in three audience registers.
- **New security boundary — unsafe auto-publish**: public repos can contain secrets, customer data,
  or prompt-injection in Markdown. Generation must delimit untrusted MD, scan/validate output, keep
  the last safe revision on failure, and **not** auto-publish without the safety gate. Triggers
  `/security-review` (this ADR + every generation/webhook change).
- **GitHub App** is now a hard prerequisite (member-repo webhooks) and a coordination cost (each
  member installs it) — accepted, because live member-repo sync is the point.
- Cost/rate: map-reduce + SHA cache bounds LLM spend to *changed* files; reduce is 3 small calls.
  Cron rank stays periodic (not per-push).
- Transitional dual-source (static + DB) exists only until the D5 cutover completes; after that the
  static catalog is deleted and the DB (with last-known-good serving) is the single source.
- RAG gains blog coverage (`sourceType='blog'`), so the chat can cite case studies.

## Alternatives considered

- **Unify Project and BlogPost into one entity** — rejected: different lifecycles, blog absent from
  RAG chunking, and the per-field project provenance doesn't transfer; unifying adds schema coupling
  for no gain (3-agent consensus).
- **One blog post per `.md` file** (antigravity/qwen round-1 position) — rejected for the customer
  goal: dev docs become thin, off-message standalone posts, and deleting a file breaks a public URL.
  A curated per-audience case study synthesized from all MD sells the work better.
- **Concatenate all MD into one generation prompt** — rejected: blows the 128K window on large repos;
  map-reduce with a blob-SHA extract cache is both bounded and incrementally cheap.
- **Keep the mutable `auto|human` owner for generated copy** — rejected: the first human edit freezes
  AI updates forever, contradicting continuous regeneration; revisions+overrides keeps both.
- **Org webhook + poll personal repos** (ADR 0003 status quo) — rejected: cannot deliver immediate
  member-repo pushes the vision requires; the GitHub App is now justified.
- **Delete the static catalog in one deploy** — rejected: removes the safety net; a brief empty DB
  would blank `/projects`. Seed → parity-gate → last-known-good → two-deploy instead.
