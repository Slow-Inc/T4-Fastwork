# ADR 0009 — decision brief (unblocks P1–P8) + a MangaDock data finding

**Date**: 2026-07-17 · **For**: the developer, to make 4 decisions that move issues #64–#71 from
`ready-for-human` → `ready-for-agent`. Prepared unattended (AFK); grounded in the code + ADR 0009 +
`Requirement.MD`. **No code was written from these** — they are recommendations for you to confirm.

Related: [ADR 0009](../adr/0009-github-sourced-ai-authored-case-studies.md) ·
PRD `docs/superpowers/specs/2026-07-17-github-ai-case-studies.md` · epic #62.

---

## Q1 — Audience variants: one URL + switcher, or three URLs? (→ #70, #71, #65)

Each project renders 3 case-study variants (`business` / `semitech` / `developer`). Routing choice:

- **Option A (recommended) — one canonical URL + a client switcher.** `/projects/[slug]` stays the
  single detail page (matches `Requirement.MD` §4.3); an audience switcher swaps the variant
  client-side (read `?aud=` in a Suspense hook, the same pattern FR-09 uses for `?project=`). The
  `developer` variant is the SSR/canonical body for crawlers; `business` is the default human view.
  *Pros:* one canonical URL = no duplicate-content/SEO dilution, one sitemap entry, simplest.
  *Cons:* non-canonical variants aren't independently indexable.
- **Option B — three URLs** `/projects/[slug]/[audience]`. *Pros:* each variant independently
  indexable / ad-targetable. *Cons:* near-duplicate content across 3 pages (needs `rel=canonical`),
  3× sitemap, overlaps `/recommend`.

**Recommendation: A.** Revisit B only if per-audience SEO landing becomes a goal (then fold into the
existing `/recommend/[type]` machinery rather than a new route).

## Q2 — Deep-dive opt-in marker (→ #65, #69)

Default is **one** canonical case study per project (synthesised from all MD); deep-dives are opt-in,
not auto-per-`.md` (auto-per-file was rejected in ADR 0009 — dev docs make thin posts).

- **Option A (recommended) — a folder convention:** any `.md` under `docs/showcase/` in the repo
  becomes an opt-in deep-dive (`kind='deep_dive'`). README + other docs stay *source material* for the
  canonical case study only. Discoverable, dev-controlled, no front-matter scanning.
- **Option B — a front-matter flag** (`showcase: true`) in any `.md`. More flexible; requires parsing
  front-matter across the whole tree.

**Recommendation: A** (`docs/showcase/` folder).

## Q3 — Member-repo eligibility (→ #66, #69, audit #13)

Sync pulls the team org **and each member's** repos — which member repos auto-showcase?

- **Option A — all public non-fork repos** above a star/activity threshold. Simple, but noisy /
  surprises members by exposing personal repos.
- **Option B (recommended) — opt-in.** Reuse the existing member CMS selection
  (`member_projects.selected` already exists) **and** a repo topic tag (e.g. `t4-showcase`) for
  auto-inclusion. Respects member intent; no surprise exposure.
- **Option C — all public repos.** Rejected (noise).

**Recommendation: B** — CMS selection + `t4-showcase` topic. This also closes audit #13 (nothing
reconciles GitHub repos → `member_projects` today).

## Q4 — P1 schema shape (→ #64)

ADR 0009 D1 proposes: `project_documents`, `blog_posts` (+`audience`/`kind`/`source`/`project_id`),
`blog_post_revisions`, `blog_post_overrides`, `generation_jobs`, and `document_embeddings.sourceType
+= 'blog'`. Two things to confirm before writing the migration:

1. **Audience enum:** `business | semitech | developer` — confirm the three values + slugs.
2. **Provenance timing:** ADR D4 wants immutable `revisions` + field-level `overrides`. For the **MVP**
   that is heavier than needed before continuous-regen exists.
   - **Recommendation:** ship P1 with a **single `owner ('auto'|'human')` column on `blog_posts`**
     (mirrors the existing project provenance), and introduce `blog_post_revisions` +
     `blog_post_overrides` in **P4** when continuous regeneration goes live. This keeps P1 small and
     reversible while preserving the D4 target.

Proposed P1 migration surface (for your review — **not** written/applied):
```
blog_posts:        + project_id (fk, nullable), audience text, kind text, source text, owner text
project_documents: (project_id, path) pk, blob_sha, content_hash, markdown, last_seen_commit, deleted_at
generation_jobs:   (project_id, input_manifest_hash, prompt_version) unique, status, attempts, error
document_embeddings.source_type: allow 'blog'   (+ index on (metadata->>'project_id') for scoped chat)
```
`blog_post_revisions` / `blog_post_overrides` deferred to P4.

---

## Data finding — `mangadock.com` is a dead/parked domain

`nextjs/content/catalog.ts:52` and the prod `projects` row both set MangaDock's live URL to
`https://mangadock.com`, which **302-redirects to `domains.atom.com/lpd/name/mangadock.com`** — a
domain-for-sale page. The site is **not live**.

- **Impact:** compounds audit finding #0 — even after the static→DB screenshot wiring is fixed, the
  screenshot worker would capture a for-sale page, and the "ดูเว็บจริง / Visit site" link leads to a
  dead domain.
- **Decision needed (product):** what is MangaDock's real live URL? A real deployment, the GitHub repo
  (`github.com/Slow-Inc/MangaDock`), or drop the live link and use a manually-provided cover image?
  Not fixable without that answer — so the "show the real website screenshot" feature cannot work for
  MangaDock regardless of the static→DB fix until the URL is corrected.
