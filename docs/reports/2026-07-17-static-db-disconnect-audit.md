# Audit — static↔DB disconnect: features written to Supabase but rendered from static

**Date**: 2026-07-17 · **Trigger**: the MangaDock project card shows a text placeholder instead of
its website screenshot · **Feeds**: [ADR 0009](../adr/0009-github-sourced-ai-authored-case-studies.md)
(the fix strategy) · **Method**: `debug-mantra` (the trigger bug) + a `clink-subagents` audit
(codex `gpt-5.6-sol`/high) whose findings were then verified against the code.

## Root cause (one architectural gap, repeated across the site)

The public site **renders from the hardcoded static exports** (`nextjs/content/*.ts`) while **every
write pipeline** — the admin CMS, GitHub sync, the rank job, the screenshot worker, the AI
content-gen — **writes to Supabase**. The two only connect for a *brand-new* slug/row; anything that
already exists as static (or was seeded) has its DB writes **silently ignored**, because the read
paths are either static-only or use a static-first merge (`mergeProjects` appends new slugs only,
`nextjs/lib/project-map.ts:66`) or a DB-first fallback that masks a never-populated DB path.

This is the same gap ADR 0009 targets for `projects`/`blog` — the audit shows it is **site-wide**.

## The trigger bug (MangaDock screenshot) — fully diagnosed

- Card renders `p.snapshotImage ? <img> : <span>{title}</span>` — `nextjs/components/projects/project-card.tsx:13`.
- Screenshot worker writes `projects.snapshot_image` in the DB — `nextjs/scripts/screenshot-projects.ts:73`,
  filtering `status='published' AND live_url IS NOT NULL AND snapshot_image IS NULL` (`:27-32`).
- `/projects` renders the **static** catalog (`nextjs/content/catalog.ts`, no `snapshotImage`) via
  `getAllProjects()` static-first; `mergeProjects` discards the same-slug DB row → the DB screenshot
  never reaches the card → text shows.
- Prod DB confirms: `mangadock` row has `snapshot_image=NULL` and `live_url` = the **GitHub repo URL**
  (`github.com/Slow-Inc/MangaDock`), not `mangadock.com` — so the worker filter is also mis-fed.

## Findings

Severity: **SILENT-BROKEN** = the feature appears to exist but never works · **DEGRADED** = works
partially/stale. "Verified" = re-checked against the code this session; "Reported" = codex-surfaced,
plausible (some corroborated by the ledger), **not yet individually re-verified** — verify before acting.

| # | Feature | Read/render | Write/pipeline | Severity | Status |
|---|---|---|---|---|---|
| 0 | **Projects (MangaDock) screenshot** | `project-card.tsx:13` + `projects-repo.ts:44` static-first | `screenshot-projects.ts:73` → `projects.snapshot_image` | 🔴 SILENT | ✅ verified |
| 1 | **FAQ CMS** | `faq-content.tsx:6` `import { faqs } from '@/content/faqs'` (no faqs-repo) | admin writes `faqs` table | 🔴 SILENT | ✅ verified |
| 2 | **Services CMS** | `ServiceList` static (no services-repo) | admin writes `services` table | 🔴 SILENT | ✅ verified |
| 3 | **Home Featured / Selected-work** | `app/page.tsx:12` static `content/catalog` | CMS `projects.is_featured` | 🔴 SILENT | ✅ verified |
| 4 | **Member ranking** | `member-content-repo.ts` orders by `ai_rank` | `rank.ts:4` `RankKind` omits `member_projects`/`member_certificates` → never ranked | 🟠 DEGRADED | ✅ verified |
| 5 | **Blog static→DB switch** | `blog-repo.ts:42` DB-first, static only if empty → static posts vanish once 1 DB row exists | CMS/member write `blog_posts` | 🟠 DEGRADED | ✅ verified |
| 6 | **Project publish state** | render filters `published_at` (`projects-repo.ts:51`) | worker/RLS use `status` → draft/hidden can leak; seed w/o `published_at` invisible | 🟠 DEGRADED | ✅ verified (= ADR 0009 P0) |
| 7 | **GitHub curate/generate** | `projects-repo.ts:44-56` (no `source='github'` rows) | `github-curate.ts:114`, `pg-generate.store.ts` — `CurateService` absent from `github.module.ts:32` providers, no caller | 🔴 SILENT | ✅ verified |
| 8 | **RAG freshness from GitHub** | `ingest-core.ts:31-98` selects projects/services/faqs only — **never** `github_snapshots` | `github-write.controller.ts:51-60` re-ingest triggers, but snapshots never ingested | 🔴 SILENT | ✅ verified |
| 9 | **Chat FAQ inline cards** | `marker-parser.ts:16` `FULL_MARKER` matches only `PROJECT`/`SERVICE` — `[FAQ:id]` is never parsed | `ingest-core.ts` embeds FAQs but no card marker resolves them | 🔴 SILENT | ✅ verified |
| 10 | **Related-work recommendations** | `recommend/[type]/page.tsx:9` `import { filterProjects, projects } from '@/content/catalog'` (static) | CMS `projects` | 🔴 SILENT | ✅ verified |
| 11 | **Certificate "Featured"** | `certificates-repo.ts:20` SELECT omits `is_featured` (orders by `sort_order`/`ai_rank` only) | CMS writes `is_featured` | 🔴 SILENT | ✅ verified |
| 12 | **Certificate static→DB switch** | `certificates-repo.ts:24,28` returns DB rows wholesale once one image-backed row exists (no merge) | CMS `certificates` | 🟠 DEGRADED | ✅ verified |
| 13 | **Member repo selection** | only `seed-member-content.ts:290` inserts `member_projects`; nothing reconciles from `github_snapshots` | GitHub refresh stores lists in `github_snapshots` | 🟠 DEGRADED | ✅ verified |
| 14 | **Automatic AI-rank refresh** | `projects-repo.ts`/`blog-repo.ts` read `ai_rank` | `.github/workflows/**` schedules only `/github/refresh`; **no** `/rank/refresh` → ranks stale | 🟠 DEGRADED | ✅ verified |
| 15 | **CMS content in sitemap** | `app/sitemap.ts:2-3` imports static `content/catalog` + `content/blog` | CMS `projects`/`blog_posts` → CMS URLs absent from SEO | 🟠 DEGRADED | ✅ verified |
| 16 | **Bilingual CMS blog** | render supports `titleEn`/`excerptEn`/`contentEn`; `blog-repo.ts` `DbPostRow` has no `*_en` fields | `blog_posts` write/mapper provide Thai only → EN falls back to Thai | 🟠 DEGRADED | ✅ verified |

| 17 | **Repo homepage/OG image not synced** | `projects.live_url` (+ card `snapshotImage`) | GitHub sync (`nestjs/src/github/**`) captures **neither** the repo `homepageUrl` **nor** `openGraphImageUrl` — no reference exists | 🔴 SILENT | ✅ verified |

**Tally**: **17/17 verified** against the code this session (0–17). SILENT-BROKEN ≈ 9, DEGRADED ≈ 8. The
codex audit was 100% accurate; finding #17 was surfaced afterward while fixing the MangaDock live URL.

### Finding #17 detail (MangaDock live URL)

The repo `Slow-Inc/MangaDock` has its **Website field set** — `homepageUrl = https://hayateotsu.space/`
(and a GitHub `openGraphImageUrl`). But the GitHub sync never reads `homepageUrl`/`openGraphImageUrl`
(grep of `nestjs/src/github/**` returns nothing), so `projects.live_url` was a stale/wrong value
(`https://mangadock.com`, a now-**parked/for-sale domain** — `mangadock.com` 302-redirects to
`domains.atom.com`) and no cover image is ever sourced from GitHub. **Fix direction** (ADR 0009 P2/P6):
the generator/curate step must map repo `homepageUrl → live_url` and may use `openGraphImageUrl` as an
interim cover fallback (a real screenshot of `live_url` remains the preferred cover). **Interim fixes
applied 2026-07-17:** corrected `live_url` (static catalog + prod DB) to `https://hayateotsu.space`;
`mergeProjects` now overlays the DB `snapshotImage` onto the static card (see #0); the screenshot
capture of `hayateotsu.space` runs via the existing worker once its Actions secrets are set (or on the
6h cron, now that `live_url` is populated).

## Fix strategy

All of these collapse into **one strategic fix: the static→DB cutover of [ADR 0009](../adr/0009-github-sourced-ai-authored-case-studies.md)**
— but the audit shows the cutover must be a **site-wide sweep**, not just `projects`/`blog`. The surfaces
to migrate/rewire: projects, blog, **faqs, services, certificates, recommend, sitemap, member projects/
certificates**, plus the RAG ingest source and the chat marker resolver. Sequence: land ADR 0009 P0
(publish-state fix, finding #6) first; then the read-path sweep per surface with a parity gate; the
"reported" findings (7–16) get verified as each surface is touched.

## Method note (delegation)

Analytical audit delegated to **codex** (`gpt-5.6-sol`/high — the reliable agent for a hard,
self-contained review); the free/faster agents were not used because verification-by-me is the
bottleneck, not enumeration. 16 findings returned in ~12 min; **all 16 then verified directly against
the code** (per the `clink-subagents` "verify everything they return" rule) — the audit was 100%
accurate, no false positives. Live Supabase contents and deployment secrets were not inspected beyond
the one `mangadock` row query that confirmed finding #0.
