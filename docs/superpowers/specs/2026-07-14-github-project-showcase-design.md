# Autonomous GitHub-Driven Project Showcase — Design Spec / PRD

**Date**: 2026-07-14
**Status**: Draft (design approved in brainstorm; pending spec review)
**Decision record**: extends [ADR 0003](../../adr/0003-github-live-team-portfolio.md) (live team portfolio) · [ADR 0001](../../adr/0001-deploy-frontend-and-backend-to-vercel.md) (Vercel)
**Requirement**: `Requirement.MD` §4.1 (Landing), §4.2 (`/projects`), §4.3 (`/projects/[slug]`), §6.1 (Project model)
**Scope**: `nestjs/src/github/` (extend) + new curate/generate services · `nextjs/` projects + team + home pages · Supabase `projects` table extension (new columns) + new snapshot keys · a GitHub Action screenshot worker · admin CMS
**Multi-agent review**: cross-checked with two independent architects (antigravity/Gemini, claude-9arm/Qwen) via clink-brainstorm — strong convergence on pipeline shape, per-field provenance, and the first-run approval gate.

---

## Problem

The `/projects` ("ผลงาน") page is served from a **hand-authored static catalog** (`nextjs/content/catalog.ts`, 10 curated entries) merged with the admin CMS. It is **mockup data** that goes stale and requires manual authoring per project. Separately, `/team/[slug]` already overlays live GitHub stars (ADR 0003) but surfaces almost none of the synced data.

We want a **fully-autonomous** project showcase: the system discovers repos, decides which become portfolio entries, writes each project's description/blog from its README + code, screenshots its live site, and keeps everything fresh — **with zero required human action**. A human may edit/override anything, and edits must never be clobbered by the next auto-sync.

## Goals

- **Autonomous end-to-end**: sync → curate → generate content → screenshot → publish, on a cron, no human in the loop for updates.
- **Human-editable, edit-safe**: any field a human edits is never overwritten by regeneration; untouched fields stay auto-fresh (per-field provenance).
- **One human touchpoint**: a **first-run approval** per newly-discovered project (prevents publishing hallucinated facts to the public); everything after that is automatic.
- **GitHub is the primary source**; non-GitHub entries can still be added manually via CMS.
- **Per-project detail pages** `/projects/[slug]` (real routes, deep-linkable, ISR) — Requirement §4.3.
- **Contributors incl. not-yet-merged**: merged contributors + open-PR authors, classified team (→ `/team`) vs external.
- **Rich team profiles**: GitHub avatar + native profile README on `/team/[slug]`.
- **Home realness**: real (not mockup) certificate popup, a team section, and a tech-stack carousel.
- **Zero user-traffic GitHub/LLM calls** — reads serve the Supabase snapshot/entries only.

## Non-goals (v1)

- Regenerating content on every push (generation is cron + delta-driven, not webhook-driven).
- Auto-selecting `is_featured` (a business/marketing decision — stays manual).
- Screenshotting inside the serverless request path (done by an external worker).
- Auto-publishing brand-new projects without the one-time approval.

---

## Architecture — the autonomous pipeline

```
 CRON (Vercel Cron / GitHub Action)  ── every ~6h + a fail-safe pass
        │  POST /github/refresh  (secret-guarded, exists)
        ▼
 [1] INGEST      GithubRefreshService (exists): org + members repo lists → github_snapshots
        │        + NEW per-repo detail for *tracked* repos: contributors, open PRs, README,
        │          + per-member: user profile, profile README   (ETag/304, delta)
        ▼
 [2] CURATE      CurateService (new): rule-based eligibility over changed repos →
        │        upserts into projects (source='github', status='draft') on first sight
        ▼
 [3] GENERATE    ContentGenerateService (new): for entries whose README SHA changed AND
        │        whose fields are still 'auto' → LLM (CUSTOM_OPENAI_*) writes structured
        │        TH+EN content; reconcile per-field; guardrails; budget cap
        ▼
 [4] SCREENSHOT  fire-and-forget job row → GitHub Action worker runs Playwright on liveUrl
        │        → Supabase Storage → entry.snapshot_image  (og:image immediate fallback)
        ▼
 [5] SERVE       projects-repo.ts merges: static catalog fallback + projects (cms + github rows)
                 → /projects, /projects/[slug]; ISR revalidateTag(`proj:<slug>`) on write
```

**Where each phase runs (serverless-aware):**

| Phase | Runs on | Rationale |
|---|---|---|
| Ingest | Vercel serverless `/github/refresh` (exists) | < 30s, ETag-cheap |
| Curate | chained in the same function | pure SQL + rules, < 5s |
| Generate | Vercel Cron serverless route; batch, budget-capped | LLM ~10–30s/call, delta-gated |
| Screenshot | **GitHub Action worker** (repo dispatch / job table) | Playwright needs a real browser process |
| Serve | Next.js ISR (exists) | zero external calls on read |

**Trigger discipline:** the **webhook only updates snapshots** (as today). It does **not** trigger LLM generation. Generation is cron + delta-driven so event volume never drives cost. Curated-repo detail (contributors/PRs/README) is fetched **only for tracked repos**, keeping GitHub calls well under 5000/h. When an admin approves/publishes a new repo, the backend fires a **targeted refresh** for that one repo immediately (so its detail appears without waiting for the next cycle).

---

## Data model

### Extend the existing `projects` table — per-field provenance

**Decision:** reuse the existing relational `projects` table (already wired to the admin CMS, `project-map.ts`, and `projects-repo.ts`) rather than a new table. This keeps one source of truth for a project, reuses the CMS + admin forms + merge logic, and avoids joining two tables at read time. We **add columns** via a migration; the existing `categories` / `project_tags` / `project_technologies` join tables are unchanged.

The core of edit-safe automation: **each editable field carries an `owner` (`'auto' | 'human'`).** Regeneration writes a field **only if it is `auto`-owned AND its source changed.** A human edit (CMS save) flips that field to `'human'`, and it is skipped forever until explicitly reverted.

```sql
ALTER TABLE projects
  -- Provenance / automation
  ADD COLUMN source        text NOT NULL DEFAULT 'cms',    -- 'cms' | 'github'
  ADD COLUMN status        text NOT NULL DEFAULT 'published', -- 'draft' | 'published' | 'hidden'
  -- (draft = auto-discovered, awaiting first-run approval; published gates anon read)

  -- GitHub linkage (null for manual/cms entries)
  ADD COLUMN gh_owner      text,          -- repo owner login
  ADD COLUMN gh_repo       text,          -- repo name
  ADD COLUMN gh_html_url   text,
  ADD COLUMN owner_type    text NOT NULL DEFAULT 'team',    -- 'team' (org Slow-Inc) | 'personal' (user)
  ADD COLUMN owner_login   text,          -- whose project (personal) / org login (team)

  -- Per-field owner flags ('auto' | 'human'). content = supplement blog (our renderer).
  ADD COLUMN title_owner        text NOT NULL DEFAULT 'human',  -- existing rows are human-authored
  ADD COLUMN title_en_owner     text NOT NULL DEFAULT 'human',
  ADD COLUMN description_owner  text NOT NULL DEFAULT 'human',
  ADD COLUMN content_owner      text NOT NULL DEFAULT 'human',
  ADD COLUMN category_owner     text NOT NULL DEFAULT 'human',
  ADD COLUMN tags_owner         text NOT NULL DEFAULT 'human',  -- covers the whole tag set
  ADD COLUMN technologies_owner text NOT NULL DEFAULT 'human',

  -- Reconciliation metadata
  ADD COLUMN readme_sha    text,          -- last README blob SHA content was generated from
  ADD COLUMN generated_at  timestamptz,
  ADD COLUMN approved_at   timestamptz;   -- set on first-run human approval
-- Existing: slug, title, title_en, description, content, live_url, snapshot_image,
--           is_featured (MANUAL ONLY), published_at, category (FK), + tag/tech join tables.
-- RLS: anon SELECT only WHERE status='published' AND published_at IS NOT NULL.
```

Notes:
- Existing rows default to `source='cms'`, `status='published'`, and **all `_owner='human'`** — so the current catalog/CMS content is never touched by regeneration. Auto-discovered rows are inserted with `source='github'`, `status='draft'`, `_owner='auto'`.
- The existing `content` column (paragraphs) holds the **authored/generated supplement blog**, rendered with our markdown renderer (bilingual `<!-- lang:xx -->` + Mermaid). The **repo README is not stored** — it is read live from the snapshot and rendered natively (see Rendering).
- `tags` / `technologies` stay in their join tables; `tags_owner` / `technologies_owner` gate the whole set (regen replaces the set only when auto-owned).
- Live-overlaid at read time (never stored): stars/forks/issues, contributors, README HTML, `pushed_at` — pulled from `github_snapshots` by `gh_owner/gh_repo`.
- `static catalog.ts` real entries are migrated into rows (`source='github'`, linked) as part of clearing the mockup.

### New `github_snapshots` keys (extend ADR 0003 table)

| Key | Source | Used for |
|---|---|---|
| `repo:<owner>/<repo>:contributors` | `GET /repos/{o}/{r}/contributors` | merged contributors |
| `repo:<owner>/<repo>:pulls` | `GET /repos/{o}/{r}/pulls?state=open` | open-PR authors (pending) |
| `repo:<owner>/<repo>:readme` | `GET /repos/{o}/{r}/readme` (raw) | README markdown + blob SHA |
| `user:<login>` | `GET /users/{login}` | avatar, name, bio, html_url |
| `user:<login>:readme` | README of repo `<login>/<login>` | native profile README |

Heavy per-repo keys are fetched **only for tracked repos** (those with a github-linked projects row). Untracked repos keep only the cheap `repos:<login>` list (stars overlay).

### `ProjectContributor` (frontend/read shape)

```ts
interface ProjectContributor {
  login: string;
  avatarUrl: string;
  htmlUrl: string;                 // GitHub profile
  contributions: number;           // merged commit count (0 for pending-only)
  status: 'merged' | 'pending';    // pending = has an open PR, not merged
  membership: 'team' | 'external'; // in the site.ts roster or not
  teamSlug?: string;               // if team → link /team/[slug]
}
```
Team match: `githubLogin(member.githubUrl) === contributor.login` (`githubLogin()` exists in `lib/github.ts`). Sort by `contributions` desc; pending-only contributors listed under a "ผู้มีส่วนร่วม (pending)" subgroup. External contributors always show, labeled "นอกทีม".

---

## Reconciliation rule (auto vs human)

On each generation pass, for a candidate entry whose `readme_sha` changed:

```
for each content field F in {title, title_en, description, description_en,
                             content_md, category, tags, technologies, year}:
    if F_owner == 'human':      skip                    # never clobber human edits
    else:                       F ← new LLM output      # auto + source changed → refresh
set readme_sha ← current, generated_at ← now
# status/published/is_featured/approved_at are NEVER touched by generation
```

- A CMS save that changes field F sets `F_owner = 'human'`. A "revert to auto" control resets it to `'auto'` (next cycle regenerates it).
- `is_featured`, `status`, and approval are outside the generation loop entirely.
- Rejected alternatives (from brainstorm): content-hashing per field (LLM non-determinism → false regens), all-or-nothing lock (too blunt), auto=base+human=patch overlay (breaks when the LLM restructures paragraphs). Per-field provenance won on both independent reviews.

## Curation rules (auto-eligibility)

A changed repo becomes a `draft` github-linked projects row when **all** hold:
- public, **not** a fork, **not** archived;
- has a description **or** a README **or** ≥1 star;
- `pushed_at` within the last 18 months;
- name not matching a junk denylist (`test`, `scratch`, `tmp`, `<login>/<login>` profile repo, dotfiles).

`owner_type` = `team` if `gh_owner === 'Slow-Inc'` else `personal`. Repos that fail stay untracked (cheap list only). The rules are tunable constants in `github.config.ts`.

## LLM content generation

- **Input (constrained):** repo name, GitHub description, README text, `languages` breakdown, topics. Nothing else.
- **Output (structured JSON):** `{ title, titleEn, description, descriptionEn, contentMd, category, tags, technologies, year }` — TH + EN.
- **Guardrails:**
  - Prompt: "Only use technologies present in the languages breakdown / README. Do NOT invent tech, clients, or features."
  - Post-validate `technologies[]` against the repo `languages` map; drop anything with no evidence.
  - `category` constrained to the existing taxonomy (Requirement §4.2 categories).
- **Delta-gated:** generate only when `readme_sha` differs from the stored one. No change → no LLM call.
- **Batching + budget:** batch candidates into one structured call where possible; hard cap LLM calls per cron run (overflow waits for the next cycle). Optional `budget`-style guard.
- **Staleness watchdog:** a light pass force-regenerates any published entry whose `generated_at` is older than 90 days (guards against "set and forget forever").
- **Graceful degradation:** LLM gateway down → log and continue; existing entries stay published.

## First-run approval gate

- A newly-discovered repo enters `status='draft'` with auto-generated content. It appears in the CMS "Suggested projects" list but is **not public**.
- A human clicks **Approve** once → `status='published'`, `approved_at=now`, and a targeted refresh fetches its detail. From then on, all auto-updates publish directly (no re-approval).
- Rationale (both reviewers, independently): the only real defense against publishing a hallucinated project fact to the public, at the cost of a single click per project — not per update.

## Screenshots / preview image

- **Source order:** (1) og:image scraped from `live_url` (cheap, immediate); (2) Playwright screenshot via the **GitHub Action worker** (free, unlimited, reuses installed Chromium) → Supabase Storage; (3) CMS manual upload override (`snapshot_image` field exists).
- Worker validates the capture (HTTP 200, min file size, a content container present) and keeps the prior image on failure.
- Trigger: a `screenshot_jobs` row on publish/liveUrl-change; a cron also back-fills entries missing an image.

---

## Frontend

### `/projects` ("ผลงาน") — Requirement §4.2

- Merges team + personal + manual entries. Existing 3-axis filter + search (query-string, deep-linkable) stays; add a **team/personal** tab.
- Card: snapshot cover, title, **owner chip** ("T4 Labs · ทีม" / "@handle · ส่วนตัว"), stacked **co-dev avatars**, ★ stars, tags, "ดูตัวอย่าง" (preview popup), "ดูรายละเอียด" (→ detail).

### `/projects/[slug]` (new) — Requirement §4.3

- **Hero**: title, owner chip, smart link buttons (categorize `homepage` → docs/preview/GitHub, per resume_web), stats ★/fork/issue, "ดูตัวอย่าง" preview popup + "คุยกับ AI"/"ติดต่อจ้างงาน" CTAs, per-page OG + JSON-LD (`SoftwareApplication`).
- **Preview popup**: near-fullscreen modal embedding `live_url` in an iframe; **fallback to open-in-new-tab** when the site blocks framing (X-Frame-Options/CSP).
- **Tech stack** chips (languages + curated).
- **ผู้มีส่วนร่วม**: merged + pending, split "ทีม" (→ `/team/[slug]`) / "นอกทีม" (→ GitHub), avatar + commit count, sorted desc.
- **Blog**: repo README rendered **native** (sanitized GitHub HTML) → then the **supplement** `content_md` rendered with our renderer (bilingual + Mermaid).

### `/team/[slug]` + `/about` team cards

- Avatar = **real GitHub avatar** (`user:<login>.avatarUrl`), fallback to the initial.
- New **profile README** section, rendered native (from `user:<login>:readme`).
- Existing projects section links each to `/projects/[slug]`; star overlay unchanged.

### Home (`/`) realness — Requirement §4.1

- **Certificate popup**: reuse the exact `/team` certificate lightbox component (currently Home shows a mockup) — 100% the same component for seamlessness.
- **Team section**: reuse the team roster/section component on Home so visitors immediately see real people.
- **Tech-stack carousel**: a marquee line of all tech used (§4.1.8), each chip deep-links `/projects?tech=<t>`.

## Rendering

- **README (repo + profile)** → sanitized GitHub-rendered HTML (native: badges, stat cards, images). One sanitization utility, allowlisted tags/attrs, external images lazy.
- **Supplement `content_md`** → our markdown renderer (styled, bilingual `<!-- lang:xx -->` fences, Mermaid), matching the MangaDock docs approach.

## Clear mockup / migration

- Audit `nextjs/content/catalog.ts` (10 entries): entries that are **real** (e.g. MangaDock) are re-modeled as GitHub-linked projects rows; pure mockups are removed.
- Home mockup cert/team/tech data replaced by the real components/data.
- Fallback path preserved: any snapshot/DB failure → static catalog (site never blanks), per ADR 0003.

---

## Phasing (each phase = its own implementation plan + issue + PR)

| Phase | Deliverable | Depends on |
|---|---|---|
| **P1** | Backend sync extension: contributors + open PRs + README + user profile + profile README snapshots; tracked-repo-only heavy fetch; targeted refresh on approve | ADR 0003 github module |
| **P2** | `projects` table extension (migration) + per-field provenance + `CurateService` (rules) + RLS + migration | P1 |
| **P3** | `ContentGenerateService` (LLM, delta, guardrails, budget) + reconciliation + first-run draft gate + staleness watchdog | P1, P2 |
| **P4** | Screenshot worker (GitHub Action + og:image fallback + Supabase Storage) | P2 |
| **P5** | `projects-repo` merge + `/projects` list (team/personal labels, co-dev avatars, filter) + clear list mockup | P2 |
| **P6** | `/projects/[slug]` detail (hero, stats, tech, contributors, blog README-native + supplement, preview popup) | P1, P2, P5 |
| **P7** | `/team/[slug]` + `/about` (GitHub avatar, native profile README, project links) | P1 |
| **P8** | Home realness (cert popup reuse, team section, tech carousel) + CMS provenance UI (approve, per-field lock/revert, is_featured) | P2, P5 |

Cron orchestration (refresh → curate → generate) lands with P3; the freshness cron/webhook wiring is shared with the ADR 0003 automation still open on the epic.

## Testing (TDD — mandatory)

- **nestjs** (`bun test`): new fetchers (contributors/pulls/readme/user), curation rules, **reconciliation rule** (human-owned skipped, auto refreshed on SHA change), LLM tech cross-validation, budget cap.
- **nextjs** (`bun test`): contributor classify (team/external, merged/pending, sort), owner-label mapping, native-README sanitization, supplement renderer, provenance CMS actions.
- **e2e** (`bun run e2e`, mandatory): `/projects/[slug]` smoke (visible `<h1>`, no nav overlap, no console errors), avatar renders, contributors show, preview popup opens + new-tab fallback, TH/EN switch. Add a case per new page.

## Risks

1. **LLM hallucinated project facts** → constrained prompt, tech cross-validation, first-run approval before public.
2. **Cost / runaway regen** → delta-gated (README SHA), generation cron-only (never webhook), per-run budget cap.
3. **Staleness** → scheduled cron + 90-day watchdog.
4. **Screenshot of blank/broken pages** → worker validation + keep-prior-on-failure.
5. **iframe-blocked previews** → new-tab fallback.
6. **Snapshot/LLM/DB outage** → serve-stale + static catalog fallback (never blank).

## Decisions locked (from brainstorm)

- Source: GitHub primary + manual non-GitHub entries. Curation: CMS-visible, rule-drafted, **first-run human approval**.
- Contributors: merged + open-PR authors; team vs external.
- Blog: repo README native (GitHub HTML) + authored/generated supplement (our renderer).
- Reconciliation: **per-field provenance** (`owner` enum).
- Preview image: og:image → Playwright worker → CMS override; iframe popup + new-tab fallback.
- `is_featured` stays manual.
