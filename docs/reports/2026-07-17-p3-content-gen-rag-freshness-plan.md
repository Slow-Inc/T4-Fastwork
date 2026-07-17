# Implementation plan — #61 P3 content-gen + #60 RAG-freshness (2026-07-17)

Decision-ready plan so the remaining Phase-4 work executes fast once shell/verify
access is available. Written during a `claude-sonnet-5` classifier outage that blocked
`bun test` / `nest build` / `git commit` (verification-gated work could not proceed).

## Already done this session (banked)

- **LlmClient adapter** — `nestjs/src/github/github-generate-client.ts`: `buildGeneratePrompt`
  (system+user, grounded in README/languages, forbids invented tech) + `parseGeneratedContent`
  (strips ```json fence / prose, validates shape, throws on bad JSON). Test:
  `nestjs/test/github-generate-client.spec.ts` (8 cases). **Uncommitted — verify then commit.**
- The pure `ContentGenerateService` (`github-generate.ts`) — reconcile + tech-guard + delta —
  already shipped (PR #29).

## #61 — remaining steps (TDD each; verify against the live backend on :4100)

1. **Verify + commit the adapter:** `bun test test/github-generate-client.spec.ts` (expect 8 pass)
   + `bun run build` (must stay exit 0) → commit.
2. **`PgGenerateStore`** (`src/github/pg-generate.store.ts`) — implements `GenerateStore`, mirror
   `src/rank/pg-rank.store.ts` (raw SQL over `@Inject(DRIZZLE)`):
   - `getContent(slug)`: `select title_owner, title_en_owner, description_owner, content_owner,
     category_owner, tags_owner, technologies_owner, readme_sha from projects where slug = $1
     and source = 'github'` → map to `CurrentContent & {readmeSha}`; null if no row.
   - `applyPatch(slug, patch)`: **MVP = scalar copy only** — update the auto-owned columns present
     in the patch (`title`, `title_en`, `description`, `content`) + `readme_sha` + `generated_at =
     now()`, in a tx. **Defer** `category` (→ `category_id` FK lookup) + `tags`/`technologies`
     (→ `project_tags`/`project_technologies` M2M) with a clear comment — a follow-up, not MVP.
   - Unit-test getContent/applyPatch against the live DB (or a fake store) — mirror rank tests.
3. **Endpoint** `POST /github/generate` (`src/github/github-generate.controller.ts`) — secret-guarded
   exactly like `rank.controller.ts` (`x-refresh-secret` / `GITHUB_REFRESH_SECRET`, constant-time).
   MVP body: `{ slug: string, context: GenerateContext, apply?: boolean }` so the **context-assembly
   from snapshots is deferred** (the caller supplies it). Runs `ContentGenerateService.generateForRepo`;
   **dry-run by default** (returns `{ generated, patch }` without writing — this IS the review gate);
   `apply:true` persists via the store.
4. **Module wiring** — mirror `RankModule`: `providers` bind `GENERATE_STORE = PgGenerateStore` and
   `GENERATE_CLIENT` = factory `(llm: LlmService) => async (ctx) =>
   parseGeneratedContent(await llm.complete(buildGeneratePrompt(ctx)))`. Register the controller.
5. **Live verification (the point of running the backend):** `POST /github/generate` with a real
   repo's context (e.g. MangaDock README/languages) → confirm the gateway returns valid JSON and the
   reconciled patch looks right. Then `apply:true` on a `source='github'` draft row and confirm the
   scalar fields updated + `generated_at` set.
6. **Approve flow (follow-up):** the schema already has `status`/`generated_at`/`approved_at`; an
   `admin_approve_generated(slug)` `is_app_admin()` RPC flips `status='published'` + `approved_at`,
   plus an admin approvals-UI card (mirror the cert/blog approve in `app/admin/(dash)/approvals`).
   Context-auto-assembly (build `GenerateContext` from the stored README + languages snapshots) and
   cron wiring (generate on refresh) are the last follow-ups. **All admin-write → `/security-review`.**

## #60 — RAG grounded in fresh GitHub data

- **Seam:** the heal/refresh path (`github-refresh.service.ts` / `github-heal.service.ts`) already
  detects a changed snapshot (readmeSha delta). On a change, enqueue a **re-ingest** of that repo's
  README/detail into `document_embeddings` via the existing ingestion pipeline
  (`src/ingestion/ingest.ts` + `embedding.service.ts`).
- **TDD:** unit-test the trigger decision (changed snapshot → re-ingest called) with a mocked
  ingester. **Live verify:** change a tracked repo, `POST /github/refresh`, confirm
  `document_embeddings` updated, then a chat query reflects the fresh content.
- Guard cost: only re-ingest on an actual readmeSha change (delta-gated), like the existing refresh.

## Notes
- Do NOT write files into `nestjs/src/**` blind during a build-tool outage — `nest start --watch`
  compiles every src file, so a type error there stops the running backend from recompiling.
- Servers were left running for this work: backend `:4100` (`/health` → ok), frontend `:3000`.
