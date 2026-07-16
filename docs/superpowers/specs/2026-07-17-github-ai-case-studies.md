# PRD — GitHub-sourced, AI-authored native case studies (kill the static catalog)

**Date**: 2026-07-17 · **Decision**: [ADR 0009](../../adr/0009-github-sourced-ai-authored-case-studies.md)
**Relates**: ADR 0003 (live portfolio) · ADR 0005 (content→DB, this completes the deferred catalog
migration #45/#51) · ADR 0008 (display order) · ADR 0006/0007 (auth/RLS)
**Status**: Draft → to be broken into issues (`/to-issues`)

**Design conformance (Requirement.MD — mandatory):** the UI/UX and data model here stay faithful to
`Requirement.MD` — the projects grid/card + detail page (§4.2/§4.3), the `Project`/`BlogPost` data
models (§6.1/§6.4, incl. `cover_image`, `excerpt`, `read_time_min`, `views`, `seo_meta`), the AI
assistant (§5.1, TH/EN), and especially **§5.5 (FR-09)** for the per-project chat (deterministic
grounding, not semantic). The additions in this PRD (GitHub-sourcing, the 3 audience variants,
map-reduce generation) are **additive** to that spec; nothing here overrides a Requirement.MD design
rule. Read the relevant §before implementing each page/component.

## 1. Problem

The public `/projects` shop window is still **hand-authored TypeScript** (`nextjs/content/catalog.ts`),
and blog likewise (`content/blog.ts`). GitHub sync only feeds a side table (`github_snapshots`) for
live stars/README on detail pages — it does not produce the portfolio list or any written narrative.
The team wants a portfolio that **sells work to customers** (SMEs + companies hiring per-project) and
is **100% AI-automated**: a developer pushing code that changes the repo's Markdown should rewrite the
public case study with no manual step, and nothing should be hardcoded in the app.

## 2. Goals / Non-goals

**Goals**
- No hardcoded content: `/projects` + blog read only from Supabase, sourced from GitHub (team org +
  each member's repos) with CMS for non-GitHub extras.
- A project renders as a **native case study**, AI-written from the repo's Markdown, in **three
  audience registers**: `business` (non-technical buyer), `semitech` (light-technical), `developer`.
- Regeneration is automatic and incremental on MD add/remove/change, cheap and idempotent, sized for
  the `qwen3.6-35b-a3b` 128K gateway.
- Human edits are preserved without blocking future AI updates.
- Case studies are searchable by the RAG chat.

**Non-goals**
- One public post per `.md` file (dev docs are source material, not editorial units).
- Real-time (<1s) regeneration guarantees — webhook-fast with a cron safety net is enough.
- Re-designing the AI *display-ranking* (ADR 0008 stays as-is).
- Migrating services/FAQ content (out of scope; this is projects + blog).

## 3. Personas (the three audience variants)

| Audience | Reader | Emphasis | Code depth |
|---|---|---|---|
| `business` | SME owner / hiring company | problem solved, outcomes, reliability, "can they deliver" | none |
| `semitech` | technical-ish buyer / PM | how it works at a high level, notable engineering choices | light |
| `developer` | fellow dev / CTO | architecture, caching/scaling, AI-dev methodology, trade-offs | deep |

## 4. Data model (see ADR 0009 D1)

- `projects` — identity; keep per-field `*_owner` provenance for facts/taxonomy; add unique
  `(gh_owner, gh_repo)` for `source='github'`.
- `project_documents(project_id, path, blob_sha, content_hash, markdown, last_seen_commit, deleted_at)`.
- `blog_posts` (into Drizzle schema): `+project_id`, `audience`, `kind`, `source`; partial-unique
  `(project_id, audience)` where `kind='case_study'`.
- `blog_post_revisions` (immutable AI output) · `blog_post_overrides` (field-level human) ·
  `generation_jobs` (idempotent unique `(project_id, manifest_hash, prompt_version)`).
- `document_embeddings.sourceType += 'blog'`.

## 5. Pipeline (see ADR 0009 D2/D3)

`push (GitHub App webhook) → 202 → worker: rebuild {path, blob_sha} manifest → hash+prompt_version →`
`skip if unchanged → Stage0 curate (globs) → Stage1 map per file (extract cached by blob_sha) →`
`Stage2 reduce ×3 audiences → validate/safety → promote iff still latest manifest → RAG re-ingest`.
Cron reconciles missed deliveries.

## 6. Phased deliverables (each → an issue)

**P0 — Security prerequisite (must land first)**
- Fix the `status`-leak read predicate (`projects-repo.ts:51` filters only `published_at`) → require
  `status='published'`; add an E2E that a `draft`/`hidden` row never renders. *AC:* hidden row absent
  from `/projects`, home, sitemap; E2E red→green.

**P1 — Schema foundation**
- Bring `blog_posts` into the Drizzle schema; add `project_documents`, `blog_post_revisions`,
  `blog_post_overrides`, `generation_jobs`; `document_embeddings.sourceType += 'blog'`; RLS on new
  tables per ADR 0007. *AC:* migrations apply on prod; `bun test` + advisors clean.

**P2 — Map-reduce generator**
- Extend `GenerateContext`/`buildGeneratePrompt` from a single README to the extract set; implement
  Stage0 curate, Stage1 map (blob_sha-cached extracts), Stage2 reduce ×audience; audience personas.
  **Also capture repo metadata the sync currently drops (audit #17): map `homepageUrl → live_url` and
  `openGraphImageUrl` as an interim cover fallback** (a real screenshot of `live_url` stays preferred).
  *AC:* unit tests for curate/map/reduce; a large-repo fixture generates 3 variants within 128K;
  unchanged files reuse cached extracts (no LLM call); a repo with a Website set populates `live_url`.

**P3 — Trigger + worker + GitHub App**
- GitHub App (org + member installs); push webhook → 202 → queued worker; per-file SHA manifest gate
  (replace `readme_sha` with `input_manifest_hash`); latest-manifest atomic promote; wire
  `CurateService` into the cron reconcile. *AC:* a push adding/removing an `.md` regenerates the right
  project only; a no-MD-change push makes zero LLM calls; missed-delivery healed by cron.

**P4 — Provenance evolution**
- Immutable `blog_post_revisions` + `blog_post_overrides`; render `override ?? latest_generated`.
  *AC:* a human override survives N regenerations; a later AI revision still updates non-overridden
  fields.

**P5 — Safety gate**
- Delimit untrusted MD in prompts; secret/PII + prompt-injection scan on input and output; keep last
  safe revision on failure; no auto-publish that fails the gate. *AC:* a planted secret/injection in a
  fixture MD is blocked from publish; `/security-review` pass.

**P6 — Kill the static catalog: site-wide static→DB sweep (two-deploy)**
- Per the [static↔DB disconnect audit](../../reports/2026-07-17-static-db-disconnect-audit.md), the
  cutover is a **repo-wide sweep**, not just projects/blog. Surfaces: projects, blog, **faqs, services,
  certificates, `/recommend`, sitemap, member projects/certificates**, plus the RAG ingest source and
  the chat marker resolver. For each: complete parity mapping (`descriptionEn`, `videoUrl`, gallery,
  taxonomy, cert `is_featured`, blog EN fields); seed static→DB; DB-first read with a merge (not a
  wholesale replace — audit #5/#12); last-known-good `stale-if-error` serving; delete the static export
  + fallback once parity holds. Verify audit findings #7–16 as each surface is touched. *AC per
  surface:* `static △ db = ∅`; full E2E/visual parity; DB-unreachable serves last-known-good, not a
  blank page; a CMS-created row appears on the public surface + in the sitemap.

**P7 — RAG + native rendering**
- `chunkBlog()`; render case studies as native blog posts with an audience switcher on the project
  page. *AC:* chat can cite a case study; the 3 variants are switchable; E2E on the new UI.

**P8 — Per-project chat via FR-09 deterministic grounding (ADR 0009 D6 · Requirement.MD §5.5)**
- **Reuse the already-built FR-09 path** (`formatProjectContext`, `buildProjectGreetingMessage`,
  `/chat?project=<slug>` + "กำลังคุยเกี่ยวกับผลงาน: {title}" banner) — do **not** add project-filtered
  RAG (contradicts FR-09's deterministic rule). Extend `ProjectContextRecord`/`formatProjectContext` to
  include the generated case-study narrative (+ top MD extracts); embed the existing chat component on
  the case-study page in FR-09 project mode; RAG stays for cross-cutting (services/FAQ/"similar work").
  *AC:* an "ask about this project" question answers from the deterministic full-project block (unit
  test on `formatProjectContext` incl. case-study content), never drifts to another project; E2E covers
  asking on a case-study page and getting a streamed, project-grounded answer; global `/chat` unchanged.

## 7. Risks

1. **Unsafe auto-publish** (secrets/PII/prompt-injection in public MD) — mitigated by P5 gate + keep
   last safe revision. **Highest risk.**
2. **Cutover parity/SEO regression** — mitigated by P6 parity gate + last-known-good serving.
3. **Missed/reordered webhooks** — durable `generation_jobs` + latest-manifest promote + cron.
4. **LLM cost on many repos** — blob_sha extract cache bounds spend to changed files.

## 8. Open questions

- Exact audience persona prompt wording + a "house voice" style guide (marketing tone).
- `deep_dive` opt-in convention (a `CASE-STUDY.md` marker? front-matter flag?).
- Member-repo eligibility: which repos of a member auto-showcase (all public? a topic tag? selected?).
- Do the 3 audience variants share one URL with a switcher, or 3 URLs (SEO)? (Leaning: one URL +
  client switcher, `developer` as the canonical for crawlers.)
