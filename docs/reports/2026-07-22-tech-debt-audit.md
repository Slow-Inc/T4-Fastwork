# Tech-Debt Audit — 2026-07-22

Comprehensive sweep to find "built but not fully wired/deployed" gaps (the B4 archetype:
coded + tested, but no cron calls it, gated behind an unapplied migration → inert end-to-end).
Sources: codex deep pipeline-trace (20 findings) + Explore mechanical sweep (6 categories);
the two corroborate. **Right-sized for a 5-person portfolio site** — production-hardening items
(durable queues, GitHub App worker) are noted but marked SKIP as over-engineering for this scale.

## The core theme — the showcase automation is a MANUAL-ONLY chain
Only the FIRST leg is scheduled. `.github/workflows/github-refresh-cron.yml` (hourly) calls
`POST /github/refresh` → fills `github_snapshots`. Everything downstream needs a hand-run curl:

```
refresh (✓ hourly cron)
  → curate  /github/curate            (MANUAL, dry-run default, undeployed)
  → member-sync /github/sync-member-projects (MANUAL, undeployed, needs 0025)
  → generate /github/generate         (MANUAL, body-supplied context)
  → case-study                        (NO PRODUCER — project_documents never written)
  → RAG ingest                        (does NOT read GitHub content)
  → rank /rank/refresh                (MANUAL, no cron)
```

## Priority ledger (right-sized)

### 🔴 P0 — cheap, real, breaks visible behaviour (do now)
1. **5 more static-fallback masks** (same class as the projects-repo + member-content-repo fixes):
   a member/cert/blog/stats DB read that returns 0 rows silently resurrects a hardcoded seed:
   - `nextjs/lib/blog-repo.ts:42` `getPosts` — empty `blog_posts` → static seed
   - `nextjs/lib/certificates-repo.ts:24` `getCertificates` — empty → `teamCertificates()`; `:28` even falls back when non-empty rows carry no image
   - `nextjs/lib/members-repo.ts:24` `getTeamTechnologies` + `:48` `getTeamMembers` — empty `members` → static roster
   - `nextjs/lib/site-stats.ts:36` + `:37` — empty counts → hardcoded numbers (per-field)
   Fix = drop the `data.length === 0` from the fallback condition (keep error-only fallback), exactly as done for projects/member-content.
2. **Wire the showcase chain into the hourly cron** — after `/github/refresh` succeeds, chain
   `/github/curate {apply:true}` + `/github/sync-member-projects {apply:true}` + `/rank/refresh`
   (add steps to `github-refresh-cron.yml`). Turns the manual-only chain automatic. (Requires the
   flat-authz branch deployed + 0025 applied first.)

### 🟠 P1 — cleanup batch (cheap, low-risk)
3. `githubLoginFromUser` (`nextjs/lib/member-auth.ts:14`) — exported orphan, 0 non-test callers → delete + its test.
4. 3 seed scripts not in package.json / CI (`seed-members`, `seed-member-content`, `seed-app-admins`) — add `db:seed:*` scripts so they're discoverable (onboarding footgun).
5. Drizzle schema lags migration 0022 — `projectDocuments` omits the `extract jsonb` column (`nestjs/src/database/schema/showcase.ts:48`).
6. `sitemap.ts` imports only static catalog/blog — dynamic DB/GitHub projects are unreachable to search engines.
7. Old generator drops generated category/tags/technologies — `reconcile()` emits them but `PgGenerateStore.applyPatch()` (`pg-generate.store.ts:51`) only writes copy fields.

### 🟡 P2 — bigger FEATURE work, not cleanup (defer; these are unbuilt features, not debt)
8. **Case-study pipeline has no producer** — nothing writes `project_documents` (the #66 tree/Markdown worker doesn't exist), so `CaseStudyGenerateService` (built, inert) can never run; and even generated drafts (`published_at=null`) are never rendered on project detail. Whole feature inert (#66/#81).
9. **RAG doesn't ingest GitHub content** — `runIngest()` re-embeds only published projects/services/faqs; never `github_snapshots`/`project_documents`/case studies. Chat can't learn README/repo changes.
10. member_projects/certs read `ai_rank` that no rank job writes (`RANK_KINDS` lacks member kinds) — silently falls back to sort_order.
11. Detail/README sync hardcoded to `GITHUB_SHOWCASE_REPOS = [Slow-Inc/MangaDock]` — new curated projects get no README/contributor/language snapshots.
12. Slug is not a repo identity (`slugify(repo.name)`) — same-name repos across owners collide + get silently skipped (`narze` already duplicated across two members).

### ⚪ SKIP — over-engineering for a 5-person portfolio (note only)
- Durable webhook delivery states / retry (transient-failure loss) — hourly cron already re-heals.
- GitHub App + installation-token push queue/worker — the org webhook + hourly cron cover it.
- Replacing serverless fire-and-forget `void` ingest with a durable job runner — fine at this scale.
- nestjs e2e suite — unit tests + the frontend e2e are enough for now.

## Notes
- No skipped/todo tests exist (clean). One monolithic `e2e/site.e2e.ts`; no backend e2e.
- Migrations: 0006 applied out-of-band "via MCP" (provenance only in a comment). 0023/0024/0025 parked for prod-apply (flat-authz branch).
- `mapRepoMetadata` was the old "written-but-unused" example — now wired (liveUrl consumed); only `coverImageFallback` half remains.
