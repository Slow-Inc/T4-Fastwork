# PRD — Project enrichment: category, tech, tags, content, live URL, snapshot

**Date:** 2026-07-24 · **Status:** approved for AFK (defaults locked from diagnosis) · **Delivery:** red-first TDD + `bun run e2e` for frontend · bilingual GitHub issues/PRs.

## Problem Statement

Most published portfolio projects show empty **category**, **technologies**, **tags**, **deep-detail content**, **Visit site** URL, and **cover snapshot**. Visitors cannot judge or filter work. Operators expected the AI/GitHub pipeline to fill these; only a few flagship rows (e.g. MangaDock) are complete. Root cause is a **pipeline gap**, not missing UI chrome: homepage→`live_url` is skipped on admin imports and never refreshed; taxonomy is only written by an unused `/github/generate` path; case-study generation writes `content` but not M2M taxonomy; screenshots require `live_url` first; many repos still lack README snapshots so generators skip.

## Solution

Close the enrichment loop for GitHub-sourced projects end-to-end:

1. Persist GitHub **Website (homepage)** into `live_url` on every ingest/refresh path when still empty/auto.
2. Ensure README detail snapshots exist so generators can run.
3. AI **selects or creates** category and attaches **technologies** + **tags** (owner-guarded), and backfill **deep-detail** `content` via the simplified case-study path.
4. Fill **snapshot_image** via existing Playwright worker and/or OG-image interim when `live_url` is present.
5. Keep human overrides (`*_owner = human`) sacred; dry-run default; capped `apply:true`; prod DB writes STOP for explicit authz when additive schema is needed.

## Locked defaults (AFK)

| Decision | Choice |
|---|---|
| Category | AI **select existing or create** new taxonomy row (`owner=auto`) |
| Tech / tags | Resolve/create names into taxonomy tables + M2M; owner-guarded |
| Order | **live_url → README coverage → taxonomy → content → snapshot** |
| Gen mode | Dry-run default; persist only on `apply:true`; caps per run |
| Prefer | Extend curate / generate / case-study / screenshot — no parallel stack |
| Admin | Human can edit taxonomy on project later (slice; not blocking AI path) |

## User Stories

1. As a visitor, I want each project to show a category, so that I can understand what kind of work it is.
2. As a visitor, I want technology chips on a project, so that I can see the stack at a glance.
3. As a visitor, I want tags on a project, so that I can discover related work.
4. As a visitor, I want deep-detail narrative on a project, so that I can evaluate fit before contacting.
5. As a visitor, I want a “Visit site” link when the repo has a Website, so that I can see the live product.
6. As a visitor, I want a cover image of the live site, so that the portfolio looks credible.
7. As a visitor, I want filters by category/tech/tag to return real matches, so that browsing works.
8. As an operator, I want homepage from GitHub mapped to `live_url` on import, so that I do not hand-paste URLs.
9. As an operator, I want `live_url` refreshed when still empty, so that later homepage edits on GitHub land.
10. As an operator, I want AI to pick or create a category, so that taxonomy stays populated without CMS busywork.
11. As an operator, I want AI to attach technologies and tags, so that chips and filters fill automatically.
12. As an operator, I want case-study content generated when README exists, so that deep detail is not blank.
13. As an operator, I want generation to skip human-owned fields, so that manual edits are never clobbered.
14. As an operator, I want dry-run before apply, so that I can review cost/impact.
15. As an operator, I want capped per-run generation, so that serverless timeouts do not 504.
16. As an operator, I want screenshots to run once `live_url` exists, so that covers fill without a second CMS step.
17. As an operator, I want an OG-image fallback when capture fails, so that cards are not empty forever.
18. As an admin, I want to override category/tech/tags later, so that AI mistakes are correctable.
19. As an agent, I want owner-guarded SQL applies, so that regen is safe under AFK.
20. As a developer, I want one enrichment epic with vertical slices, so that AFK can ship tracer bullets.
21. As a visitor on TH/EN, I want bilingual copy where the product already expects it, so that locale switch stays coherent.
22. As an operator, I want README detail sync to cover published GitHub projects, so that generators stop no-opping.
23. As an operator, I want org/member import to carry homepage→`live_url`, so that Slow-Inc bulk import is not thin.
24. As a security reviewer, I want secret-guarded generate endpoints and no service-role on Next, so that trust boundaries hold.
25. As an operator, I want revalidation after apply, so that ISR pages show new enrichment promptly.

## Implementation Decisions

### Test seams (locked for AFK)

Prefer existing pure seams; minimize new ones:

1. **Homepage → live_url mapping** (extend `mapRepoMetadata` / import mappers) — unit-tested pure functions.
2. **Taxonomy patch parse + owner filter + create-or-select resolve** — pure + store apply with owner SQL guards (mirror overview/generate stores).
3. **Secret-guarded generate/apply controllers** — dry-run vs `apply:true`, caps (mirror overview controller specs).
4. **Public project map/UI** — already renders fields; e2e asserts non-empty category/tech/live link/snapshot when fixtures exist.

### Technical decisions

- **D1 — live_url:** Thread homepage through org/member import; add refresh/upsert for `source='github'` when `live_url` is null (do not overwrite human-set URLs if an ownership signal exists; if none, treat null as fillable).
- **D2 — README coverage:** Keep/widen targeted or budgeted repo-detail sync so published GitHub projects gain `repo:owner/repo:readme` snapshots.
- **D3 — Taxonomy AI:** Wire generation that writes `category_id` + `project_technologies` + `project_tags`. Prefer extending the existing generate apply path and/or persisting taxonomy from case-study output instead of a third LLM stack. Unknown category/tech/tag **names may be created** as taxonomy rows with auto ownership.
- **D4 — Content:** Backfill `projects.content` via simplified case-study generator for empty auto-owned content when README exists; cron already exists — ensure publish status/eligibility and caps.
- **D5 — Snapshot:** Ensure screenshot Action fills null `snapshot_image` when `live_url` set; optionally write OG URL interim from GitHub metadata when capture unavailable.
- **Cron:** After D1–D4 land, chain capped apply steps only where safe; otherwise document manual/AFK backfill commands.
- **Schema:** Prefer no new tables; additive columns only if ownership for `live_url` is required — default is “null means fillable”.
- **Prod DB:** Any new migration STOP for explicit authz; data writes via existing Nest pooler generate paths with `apply:true` after dry-run.

## Testing Decisions

- Good tests assert external behavior at seams above (inputs→outputs), not private helpers.
- Nest: `*.spec.ts` under `nestjs/test/` with bun test (controller auth fail-closed, dry-run no write, owner skip).
- Next: unit tests for import/map; `bun run e2e` for public project detail showing enrichment when data present.
- Prior art: project-overview, tech-used-for, org-repo-import, case-study-simple, generate controller specs.

## Out of Scope

- Rewriting ADR 0013 case-study architecture or reviving ADR 0009 map-reduce.
- Member (non-admin) taxonomy CMS.
- Guaranteeing every private/empty README repo gets deep detail.
- Full redesign / #110 art direction.
- Changing public filter UX beyond consuming filled taxonomy.

## Further Notes

- Prod snapshot (2026-07-24): ~47 published; ~46 missing category, live_url, content, snapshot — enrichment is systemic.
- Overview cards and tech used-for blurbs already shipped; this epic fills the **structural** fields those features assume.
- Dependency order is hard: without `live_url`, screenshots never run; without README, content/taxonomy generators no-op.

## Deliverables → issues

- **D1** — Homepage → `live_url` on import + refresh
- **D2** — README detail coverage for published GitHub projects
- **D3** — AI category (select/create) + technologies + tags onto projects
- **D4** — Deep-detail `content` backfill via case-study path
- **D5** — Snapshot cover (screenshot worker + OG fallback)
