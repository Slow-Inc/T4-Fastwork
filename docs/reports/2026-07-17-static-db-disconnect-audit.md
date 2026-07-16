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
| 7 | **GitHub curate/generate** | `projects-repo.ts:44-56` (no `source='github'` rows) | `github-curate.ts:114`, `pg-generate.store.ts` — no store/provider/caller wired | 🔴 SILENT | 🟡 reported (ledger ✓) |
| 8 | **RAG freshness from GitHub** | `ingest-core.ts:31-98` reads projects/services/faqs only | `github-write.controller.ts:51-60` re-ingest triggers, but snapshots never ingested | 🔴 SILENT | 🟡 reported (ledger ✓) |
| 9 | **Chat inline cards for DB content** | `inline-card.tsx`, `marker-parser.ts:10-17` resolve against static arrays; `[FAQ:id]` not parsed | `ingest-core.ts`, `system-prompt.ts` | 🔴 SILENT | 🟡 reported |
| 10 | **Related-work recommendations** | `recommend/[type]/page.tsx:8-39` filters static catalog | CMS `projects` | 🔴 SILENT | 🟡 reported |
| 11 | **Certificate "Featured"** | `certificates-repo.ts:14-28` never selects `is_featured` | CMS writes `is_featured` | 🔴 SILENT | 🟡 reported |
| 12 | **Certificate static→DB switch** | `certificates-repo.ts` replaces static fallback wholesale | CMS `member_certificates` | 🟠 DEGRADED | 🟡 reported |
| 13 | **Member repo selection** | `member-content-repo.ts` limited to seeded rows | GitHub refresh stores lists in `github_snapshots`; nothing reconciles → `member_projects` | 🟠 DEGRADED | 🟡 reported (ledger ✓) |
| 14 | **Automatic AI-rank refresh** | `projects-repo.ts`/`blog-repo.ts` read `ai_rank` | only `/github/refresh` is scheduled; `/rank/refresh` never cron'd → ranks stale | 🟠 DEGRADED | 🟡 reported |
| 15 | **CMS content in sitemap** | `app/sitemap.ts:2-44` enumerates static exports | CMS `projects`/`blog_posts` → CMS URLs absent from SEO | 🟠 DEGRADED | 🟡 reported |
| 16 | **Bilingual CMS blog** | render supports `titleEn`/`excerptEn`/`contentEn` | `blog_posts` write/mapper provide Thai only → EN falls back to Thai | 🟠 DEGRADED | 🟡 reported |

**Tally**: 7 verified (0–6), 9 reported (7–16). SILENT-BROKEN ≈ 8, DEGRADED ≈ 8.

## Fix strategy

All of these collapse into **one strategic fix: the static→DB cutover of [ADR 0009](../adr/0009-github-sourced-ai-authored-case-studies.md)**
— but the audit shows the cutover must be a **site-wide sweep**, not just `projects`/`blog`. The surfaces
to migrate/rewire: projects, blog, **faqs, services, certificates, recommend, sitemap, member projects/
certificates**, plus the RAG ingest source and the chat marker resolver. Sequence: land ADR 0009 P0
(publish-state fix, finding #6) first; then the read-path sweep per surface with a parity gate; the
"reported" findings (7–16) get verified as each surface is touched.

## Method note (delegation)

Analytical audit delegated to **codex** (the reliable agent for a hard, self-contained review); the
free/faster agents were not used because verification-by-me is the bottleneck, not enumeration. 16
findings returned in ~12 min; 7 verified directly this session, the rest flagged reported-not-verified
per the `clink-subagents` "verify everything they return" rule.
