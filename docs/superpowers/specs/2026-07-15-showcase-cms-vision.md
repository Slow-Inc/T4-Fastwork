# Vision PRD — GitHub-sourced, AI-curated, member-editable showcase

> **Umbrella / epic-map PRD.** Holds the whole 2026-07-15 product vision so no
> epic or task is forgotten. Each epic below gets its own detailed PRD + issues
> (one PRD per epic, per T4 workflow); this doc is the backbone that links them
> and records the **shared architecture decisions** they all depend on.
>
> - Foundation already built: `docs/reports/2026-07-15-system-state-survey.md`
> - Open-work rows: `docs/OPEN-WORK-LEDGER.md` → "AI-curated member CMS vision"
> - Memory: `showcase-system-already-built`, `showcase-vision-2026-07`
> - Committed doc = English (CLAUDE.md scopes bilingual to the GitHub tracker).

## 1. North star

A portfolio/profile system that **adjusts itself automatically from data** —
GitHub as the primary source (more sources later) — so members don't hand-maintain
it, with an **optional override/authoring layer** on top, and **AI curation** that
orders what visitors see by how much it earns trust.

Three value pillars, mapped to what already exists:

| Pillar | Built today | Gap this vision closes |
|---|---|---|
| **Auto from data** | GitHub sync (cron+webhook+heal), curate/generate (P2/P3, built-unwired), Playwright screenshots | wire P2/P3 (tracked separately); nothing new here |
| **AI curation** | nothing (all listings are static/insertion order) | **Epic B** — rank for display |
| **Member-editable** | admin CMS (single-tier, admin-only); team is static `content/site.ts` | **Epic C** — member self-service + members DB |
| **Home surfacing** | static sections | **Epic A** — team tech carousel |

## 2. Epics (each → own PRD + issues)

| Epic | Size | Own PRD | Summary |
|---|---|---|---|
| **A. Team tech-stack carousel** | S | issue-level (this doc §5A) | icon marquee of the union of members' `stack`, between Hero and Featured |
| **B. AI display-ranking** | M | `2026-07-15-ai-display-ranking.md` (to write) | rank certs/projects/featured/team-work/blog for display via `LlmService` |
| **C. Member self-service profile CMS** | L | `2026-07-15-member-profile-cms.md` (to write) | members table + per-member auth + member-scoped edit UI |
| _(D. Wire curate/generate P2/P3)_ | M | — | already tracked (ledger Deferred); not part of this vision's new work |

**Sequencing:** A → B → C. A is a quick, forward-compatible win; B builds on
data that already exists; C is the largest (DB + auth) and lands last.

## 3. Shared architecture decisions (recommended — confirm in review)

These are load-bearing across epics; deciding them once here keeps the per-epic
PRDs consistent.

- **D1 — Reuse the existing per-field provenance model.** `projects` already has 7
  `*_owner` columns (`'auto'|'human'`) and a `reconcile` that never overwrites
  human-owned fields (`github-generate.ts:68`). **Extend this same pattern** to every
  member-editable and AI-curated field (member profile fields, AI rank). Human edit
  (or admin override) flips a field to `'human'`; auto processes (GitHub sync, AI
  rank) only touch `'auto'` fields. One mental model for the whole system.
- **D2 — AI ranking is computed offline and persisted, not per-request.** Portfolio
  content changes rarely; compute rank on the refresh/ingest cron (reuse the GitHub
  refresh cadence), write a numeric `ai_rank`/score column, and serve it with a plain
  `ORDER BY`. Cheap reads, deterministic, no per-visitor LLM cost. A manual
  (`'human'`-owned) `sort_order` **overrides** the AI rank (per D1).
- **D3 — Member auth = GitHub OAuth.** Members already ARE GitHub identities and the
  data is GitHub-sourced; "Log in with GitHub" auto-links the session to the member's
  handle (`github.config.ts` member list), so no separate account/mapping to maintain.
  Admins stay on the existing `ADMIN_EMAILS` allowlist with global scope.
- **D4 — Additive member content is draft → admin-approve.** Member-authored items
  with no GitHub source (certificates, blog articles) are created as `draft` and
  published by an admin — matching the existing draft/approve philosophy and keeping
  brand-facing content reviewed. (Profile overrides on already-visible fields do not
  need approval; they're the member's own facts.)
- **D5 — Admin retains global override; members are scoped to their own record.**
  The existing admin CMS is unchanged and authoritative; member self-service is an
  additional, row-scoped surface, not a replacement.

## 4. Task inventory (anti-forget checklist)

Every planned issue, so nothing drops. Detailed acceptance criteria live in each
epic PRD; `→ #` filled in when the issue is created.

**Epic A — Tech carousel** (→ 1 issue)
- [ ] A1 — `teamTechnologies` derivation (union of `member.stack`, deduped) + `TeamTechCarousel` presentational component (reuse `TechChips`/`tech-logos`), placed between Hero and Featured; icon-first with text fallback; `prefers-reduced-motion`; hook-free + unit-tested; e2e. Config flag for icon-only vs all (default icon-first).

**Epic B — AI display-ranking** (→ ~5 issues)
- [ ] B1 — ranking service: `RankService` reusing `LlmService.complete()` with a rubric prompt (impact-to-customer, credibility/issuer prestige + verifiability, recency, audience relevance); pure scoring/parsing unit-tested; injected LLM client (like `github-generate`).
- [ ] B2 — schema + persistence: `ai_rank` (or reuse `sort_order` with an owner flag per D1) on `projects`, `certificates`, `blog_posts`; migration + `RankStore`.
- [ ] B3 — cron wiring: compute ranks on the refresh cadence (D2); admin/manual override wins (D1).
- [ ] B4 — read-path ordering: `getAllProjects`/certs/blog repos `ORDER BY` the rank; certificates **best 9 + "see more"** (today renders all, no limit).
- [ ] B5 — surfaces: apply to home Featured, Selected-work, team collaborative work, `/projects`, blog. e2e per surface.

**Epic C — Member self-service profile CMS** (→ ~6 issues)
- [ ] C1 — `members` table (migrate team out of static `content/site.ts`): identity (handle/slug/github), profile fields + `*_owner` provenance (D1), relations to certs/projects selection.
- [ ] C2 — GitHub OAuth login for members (D3) + session→member linking + route guard scoped to own record.
- [ ] C3 — member edit UI: profile, skills, tech stack, README toggle, **project selection** (pick which fetched GitHub repos to show).
- [ ] C4 — additive content: member certificates + blog authoring, draft → admin-approve (D4); add the missing edit actions to admin blog/certs.
- [ ] C5 — public read path: `/team/[slug]` + home team sections read members from DB (with the static fallback pattern) instead of `content/site.ts`.
- [ ] C6 — admin: a Team/Members section in the admin dash (global override, approve queue for D4).

**Epic D — (already tracked)** wire curate/generate P2/P3 — see ledger Deferred.

## 5. Epic A inline spec (small enough to skip a standalone PRD)

**Goal:** a home "tools our team works with" band that stays truthful to each
member's real stack and adds tasteful motion between the Hero and the Featured work.

**Behaviour:**
- Data: `teamTechnologies` = deduped union of every `member.stack` (today static
  `content/site.ts`; swaps to the members DB in Epic C with no component change —
  the component consumes a `string[]`).
- Render: reuse `TechChips`/`lib/tech-logos` so brands show a monochrome logo, others
  fall back to a text chip. A continuous marquee (CSS-only, like the removed one but
  icon-based and team-sourced). One ambient motion element; `prefers-reduced-motion`
  → static wrap.
- Placement: between `<Hero />` and `<FeaturedCarousel />` in `app/page.tsx`.
- Filter config: a flag choosing icon-only vs icon+text (default: icon-first with
  text fallback). Left as a code constant now; becomes an admin setting later.
- Constraints: presentational component stays **hook-free** (flair via CSS), pure +
  unit-tested; verify with `bun test` + `bun run e2e` (+ `rm -rf nextjs/.next` before
  in-browser checks). Distinct from the §05 filter chips (clickable, text) — this is
  icon, ambient, team-sourced; a different purpose, so not the earlier duplication.

**Acceptance:** union renders every distinct member tech once; brands with a vendored
logo show the icon; no console/hydration errors; reduced-motion static fallback; the
§05 filter chips are unchanged.

## 6. Out of scope (this vision)

Wiring P2/P3 curate/generate (separate, tracked); new GitHub-alternative data
sources (future); full RBAC beyond member-vs-admin.
