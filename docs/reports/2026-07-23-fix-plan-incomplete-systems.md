# Fix Plan — make the incomplete systems actually work

**Date:** 2026-07-23 · **Author:** audit + clink-brainstorm (codex gpt-5.6-sol/high) synthesis
**Basis:** the 2026-07-23 ADR×codebase audit (4 subagents + infra checks). Supersedes the heavy
half of ADR 0009 (see the pivotal decision below) — a new ADR 0013 records that.
**Scale constraint (load-bearing):** a small agency portfolio for a 4-5 person team + their clients.
The North Star is a GitHub-sourced, self-updating, admin-editable showcase where nobody hand-maintains
content. **Every choice below is the simplest thing that makes the system genuinely work end-to-end.**

---

## Pivotal decision — SIMPLIFY the case-study generator (do NOT finish ADR 0009's full pipeline)

The map-reduce generator core, extract cache, and Postgres store are already built and unit-tested, but
the whole pipeline is dormant: nothing populates `project_documents`, nothing triggers
`CaseStudyGenerateService`, the provenance tables don't exist, there's no GitHub App, no `chunkBlog`, no
auto-publish, no audience UI. Finishing the full ADR-0009 design (GitHub App + per-file manifest +
blob-SHA cache + map-reduce + 3 audiences + immutable revisions + overrides) is **over-engineering for
4-5 users**.

**Replace it with one canonical, bilingual, README-grounded case study per project, generated on the
existing hourly cron:**

```
hourly cron (already live) → for each published project with a gh repo:
  cached README (github snapshot) + description + topics + language + live_url
  → ONE guarded LLM call (reuse the existing github-generate injection-delimit + taxonomy validation)
  → ONE transaction: upsert blog_posts (kind='case_study', source='github', published_at=now)
                     + mirror the narrative into projects.content (so RAG/chat see it via chunkProject)
                     + advance readme_sha LAST
  → delta gate: unchanged readme_sha ⇒ zero LLM calls
  → human takeover: admin edits a generated post ⇒ owner='human' ⇒ cron never overwrites it again
```

Delivers ~90% of the customer-visible value with a fraction of the code, LLM calls, credentials, and
failure modes. Accepted trade-offs: updates lag ≤1 hour; README-poor repos give thinner copy; no
generated revision history; one broadly-useful narrative instead of three audience variants.

**Reuse, don't rebuild:** the single-README generator already exists (`nestjs/src/github/github-generate.ts`,
`github-generate-client.ts`, `pg-generate.store.ts`, `POST /github/generate`). Extend that path to also
write a `blog_posts` case-study row — the map-reduce engine (`github-case-study.ts`) is retired, not wired.

---

## Waves (ordered by value-per-effort)

Effort scale: **S** ≤1 day · **M** 2-4 days · **L** ~1-2 weeks.

### Wave 0 — documentation + migration hygiene (do FIRST) · S

Prevents an engineer from building the obsolete pipeline or colliding a migration.

- **ADR 0012 — flat-authz.** Records "admin = any linked member, no approvals" (rationale currently only
  in the SQL headers of migrations 0023/0024). Marks the draft→approve part of **ADR 0005** and all of
  **ADR 0006** *Superseded by 0012*. Keep ADR 0007's RLS mechanism intact.
- **ADR 0013 — case-study simplification.** Records the pivotal decision above; marks ADR 0009 D2-D4 +
  the GitHub-App requirement *Superseded*, and ADR 0010 (extract-cache column) as unused by the chosen
  runtime.
- Fix the false line in **ADR 0011** ("ADR 0005 additive draft→approve is unchanged").
- Reconcile the prod migration ledger for 0023-0025 (they were applied out-of-band; the tracking table
  has no rows) **before** adding any new migration — via the supported path, never by hand-editing the
  tracking table.

**Gate:** ADR index + cross-links agree with live code; a dry-run proves the next additive migration
won't replay existing policies.

### Wave 1 — close the silent CMS holes (highest value/effort) · M

Admin CMS writes that render nowhere today. Each is a small, highly-visible win.

| Item | Change | Files |
|---|---|---|
| FAQ | Add `nextjs/lib/faqs-repo.ts` (DB-first + static fallback); seed the current static rows; feed `FaqContent` + the FAQ JSON-LD from the DB | `components/pages/faq-content.tsx:6`, `app/faq/page.tsx:8`, `content/faqs.ts` |
| Services | Add `nextjs/lib/services-repo.ts`; home §Services reads DB; **chat service cards carry DB title/description** so `InlineCard` drops the static import | `components/site/service-list.tsx:3`, `components/chat/inline-card.tsx:2`, `content/services.ts`, nestjs chat card emitter |
| Home "Selected work" mosaic | Feed `ProjectGallery` from the already-DB-backed, AI-ranked project list (top-N published); keep tile sizes positional; delete `content/projects.ts` `featuredProjects` after parity | `components/site/project-gallery.tsx:2,9`, `app/page.tsx:47` |
| Certificate `is_featured` | Add `is_featured` back to the SELECT + mapper; sort featured-first, then `sort_order`/`ai_rank` | `lib/certificates-repo.ts:20`, `lib/certificate-map.ts` |
| Revalidation targets | Add `/faq`, `/` (services/mosaic), `/about` + `/` (certs) to the on-demand revalidation allowlist | `lib/revalidate.ts:44` |

**Gate (per item):** create/edit one DB row → prove it renders on the public surface; unit tests + `bun run e2e`.

### Wave 2 — freshness, SEO, and GitHub detail parity (prerequisite for generation) · M

| Item | Change | Files |
|---|---|---|
| Blog bilingual + metadata | Add tracked `title_en/excerpt_en/content_en` + `audience`/`kind` columns (align Drizzle + RLS grants); map them in `blog-repo` | `lib/blog-repo.ts`, `schema/showcase.ts`, new migration |
| Blog SEO | `sitemap.ts` + `/blog/[slug]` `generateStaticParams` read DB (`getPosts`), keep `dynamicParams`; add `/blog`, `/blog/[slug]`, `/sitemap.xml` to revalidation | `app/sitemap.ts:39`, `app/blog/[slug]/page.tsx:8,15` |
| Team page freshness (#92) | Give `/team/[slug]` a short ISR interval (e.g. `revalidate = 300`), keep `dynamicParams`. Do **not** build realtime team-page invalidation | `app/team/[slug]/page.tsx:16` |
| GitHub live detail beyond MangaDock | Replace the hardcoded `GITHUB_SHOWCASE_REPOS` constant with a DB query for non-hidden projects that have `gh_owner`+`gh_repo`; ETag-sync README/contributors for that small set | `nestjs .../github.config.ts:25`, `github-refresh.service.ts`, `lib/github.ts` |

**Gate:** a newly published DB post appears in the sitemap + resolves; an admin member edit appears within
the ISR TTL; ≥2 non-MangaDock projects show a live overlay.

### Wave 3 — the simplified self-updating case study · L

Depends on Wave 2 (blog schema + DB-derived detail snapshots for non-MangaDock repos).

- Add a secret-guarded `POST /github/generate-case-studies` (mirrors the existing `/github/curate` guard),
  and chain it into `github-refresh-cron.yml` **after** curate/sync, **before** rank, fail-soft.
- Iterate published gh-backed projects sequentially; `readme_sha` is the sole delta gate.
- One guarded LLM call per changed README (reuse `github-generate-client` delimiters + taxonomy validation)
  → bilingual canonical case study.
- One transaction: upsert the `blog_posts` case-study row (published), mirror the narrative into
  `projects.content`, advance `readme_sha` last.
- Admin edit of a generated post ⇒ `owner='human'` ⇒ future runs skip it.
- After changed writes: trigger the existing RAG ingest + frontend revalidation.

**Gate (canary one repo):** changed README ⇒ exactly one LLM call, publishes project + blog copy, updates
chat grounding + sitemap, revalidates; unchanged SHA ⇒ zero LLM calls; a simulated mid-write failure keeps
the previous content and retries next hour.

### Wave 4 — retire the dormant pipeline · S

After Wave 3 is stable in prod: remove the unused `CaseStudyGenerateService`/map-reduce runtime wiring and
its open-work commitments. **Leave `project_documents`/`generation_jobs` tables in place** (non-destructive);
delete the obsolete `content/*.ts` data exports only after their DB parity gates pass.

---

## Explicitly SKIP / DROP (over-engineering for 4-5 users)

GitHub App + installation tokens · personal-account push webhooks · repo tree-walk + `project_documents`
as a runtime prerequisite · per-file blob-SHA extract cache · map-reduce / hierarchical reduce · three
audience variants + audience switcher UI + per-audience URLs · `blog_post_revisions`/`blog_post_overrides` ·
durable queues / workers / retry state machines · a separate blog RAG source type + `chunkBlog` · immediate
destructive drop of the pipeline tables · realtime team-page invalidation.

## Cross-cutting risks + mitigations

- **static→DB cutover blanks a page** → seed first, compare slug/count + bilingual/media parity, switch one
  surface per PR (never two long-lived sources of truth).
- **automation overwrites a human edit** → `owner='auto'` predicate on writes; every CMS edit of generated
  content atomically claims `owner='human'`.
- **generation half-succeeds and advances the SHA** → project + blog + publish + SHA in ONE transaction,
  SHA updated last; failure preserves last-good and retries next hour.
- **cached pages hide successful writes** → explicit revalidation allowlist per surface + short ISR TTL for
  team pages.
- **migration tracking drift blocks schema work** → reconcile 0023-0025 via the supported path first.

## Discipline (every wave)

TDD red→green per slice · `bun run e2e` after every frontend change · `/security-review` on any
authz/RLS/generation/secret change · one real "DB write → public render" check per migrated surface ·
bilingual issue/PR bodies (EN + full TH mirror) · one issue per deliverable, referenced from its PR.
