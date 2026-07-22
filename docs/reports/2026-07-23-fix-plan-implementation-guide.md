# Fix Plan — Implementation Guide (ticket-by-ticket, execute exactly)

**Companion to** `2026-07-23-fix-plan-incomplete-systems.md` (the strategy/why). This file is the HOW,
written for an executor agent. **Every ticket is self-contained**: files, exact steps with code skeletons,
migration SQL, tests, acceptance criteria, and explicit DO-NOT guardrails. Do the tickets in order within a
wave; run each ticket's acceptance gate before moving on. All code identifiers/paths below are verbatim from
the current codebase (verified 2026-07-23).

## Global rules (apply to EVERY ticket)

- **TDD:** write the failing test first, then the code. Frontend change → also `cd nextjs && bun run e2e`.
- **Bun:** `bun`/`bunx`, never `npm`/`npx`. Bun exe: `$USERPROFILE/.bun/bin/bun.exe`. `gh` at `/c/Program Files/GitHub CLI/gh.exe`.
- **The canonical DB-first repo pattern** (copy this shape for every new `*-repo.ts`):
  ```ts
  import 'server-only';
  import { publicDb } from '@/lib/public-db';
  import { <staticFallback>, type <ViewModel> } from '@/content/<x>';
  export interface Db<X>Row { /* snake_case cols, each `| null` for nullables */ }
  export function mapDb<X>(row: Db<X>Row): <ViewModel> { /* pure, null-coalesce */ }
  const SELECT = 'col_a,col_b,...';
  export async function get<X>(): Promise<<ViewModel>[]> {
    try {
      const supabase = publicDb();
      const { data, error } = await supabase.from('<table>').select(SELECT).order(...);
      if (error || !data || data.length === 0) return <staticFallback>;   // fallback ONLY on error/empty
      return (data as unknown as Db<X>Row[]).map(mapDb<X>);
    } catch { return <staticFallback>; }
  }
  ```
- **DO NOT** hand-edit `supabase_migrations.schema_migrations`. **DO NOT** apply a migration to prod yourself —
  author the `.sql` file; a human/authorized path applies it (see `authz-migration-prod-caution` memory).
- **DO NOT** delete a static `content/*.ts` file until its DB parity gate passes (seed + count match).
- **Migrations are additive + idempotent**: always `add column if not exists` / `create ... if not exists`.
- New migration numbers continue from **0026** (0023/0024/0025 already exist). Check `supabase/migrations/`
  for the highest number before naming a new file.

---

# WAVE 0 — documentation + migration hygiene (do FIRST) · effort S

### T0.1 — Write ADR 0012 (flat-authz)
**File (new):** `docs/adr/0012-flat-team-authz-any-linked-member-is-admin.md`
**Steps:**
1. Copy the header format from an existing ADR (e.g. `docs/adr/0011-*.md`): `# ADR 0012 — ...`, `**Status**: Accepted`, date `2026-07-23`, `**Relates to**` links.
2. Body: record the decision "admin = ANY linked member; no member/admin split; no approvals" — pull the rationale from the SQL headers of `supabase/migrations/0023_flatten_authz_team_admin.sql` and `0024_flatten_member_owned_tables.sql`. State the load-bearing guardrail: `link_current_member()` is UPDATE-only (claims a pre-seeded row by unspoofable GitHub login, never INSERTs), so "every member = admin" == the seeded team, not the public.
3. Add `**Supersedes**: ADR 0006 (admin = is_admin) in full; ADR 0005's draft→approve gate.`
4. Edit `docs/adr/0006-*.md` line 1 area: add `**Status**: Superseded by 0012`. Edit `docs/adr/0005-*.md`: mark the draft→approve section `Superseded by 0012` (keep the provenance + static→DB parts as still-valid).
5. Edit `docs/adr/README.md` table rows for 0005 and 0006: change Status to `Superseded by 0012`; add a new row for 0012.

**Acceptance:** `docs/adr/README.md` lists 0012; 0005/0006 show Superseded; grep for the flat-authz rationale finds it in an ADR, not only SQL. No code change.

### T0.2 — Write ADR 0013 (case-study simplification)
**File (new):** `docs/adr/0013-simplified-single-readme-case-study.md`
**Steps:**
1. Record the decision from `2026-07-23-fix-plan-incomplete-systems.md` (the pivotal section): one canonical README-grounded case study per project on the hourly cron; reuse the existing `github-generate` path; write `blog_posts` + mirror `projects.content`.
2. Add `**Supersedes**: ADR 0009 D2 (map-reduce), D3 (GitHub App + webhook worker + per-file manifest), D4 (immutable revisions + overrides); marks ADR 0010 (extract-cache column) as unused by the runtime.`
3. List the explicit SKIP set (from the plan doc).
4. Update `docs/adr/README.md`: mark 0009 `Partially superseded by 0013`, 0010 `Unused (see 0013)`; add the 0013 row.

**Acceptance:** README lists 0013; 0009/0010 annotated. No code change.

### T0.3 — Fix the false claim in ADR 0011
**File:** `docs/adr/0011-auto-publish-public-repos-visibility-is-authorization.md` (~line 58).
**Step:** Replace the sentence asserting "ADR 0005 additive draft→approve is unchanged" with: "Member/manual editorial flows are unchanged; the draft→approve gate itself was later removed by flat-authz (ADR 0012)."
**Acceptance:** grep the file for "draft→approve is unchanged" → 0 hits.

### T0.4 — Migration ledger note (no apply)
Before writing any new migration in later waves, add a one-line note to `docs/OPEN-WORK-LEDGER.md` that 0023–0025 were applied out-of-band (tracking drift) and the next migration (0026+) must be applied via the supported path. **Do not touch the tracking table.**

---

# WAVE 1 — close the silent CMS holes · effort M

> Prereq for all Wave-1 DB reads: confirm anon (the `publicDb()` client) can `SELECT` the table. If a read
> returns empty on a seeded table, RLS is blocking anon — add `grant select on public.<table> to anon;` +
> a permissive `select` RLS policy in the same migration (mirror how `projects`/`blog_posts` are exposed).

### T1.1 — FAQ: DB-first read
**DB table (exists, Drizzle `content.ts:126`):** `faqs(id, question, answer, category, sort_order)` — SINGLE-LANGUAGE.
**Decision:** add nullable EN columns so the DB can hold both; EN falls back to TH when null.

**Files:** new migration `supabase/migrations/0026_faqs_services_en_columns.sql`; new `nextjs/lib/faqs-repo.ts`; edit `nextjs/components/pages/faq-content.tsx`, `nextjs/app/faq/page.tsx`; update Drizzle `nestjs/src/database/schema/content.ts`.

**Steps:**
1. Migration `0026` (share with T1.2):
   ```sql
   alter table public.faqs
     add column if not exists question_en text,
     add column if not exists answer_en text;
   alter table public.services
     add column if not exists description_en text;
   -- ensure anon can read (verify first; add only if missing):
   grant select on public.faqs to anon;
   grant select on public.services to anon;
   ```
2. Update Drizzle `content.ts` `faqs` + `services` tables to add `questionEn: text('question_en')`, `answerEn: text('answer_en')`, `descriptionEn: text('description_en')` (keeps schema in sync; no behavior change).
3. Create `nextjs/lib/faqs-repo.ts` following the canonical pattern. The view model is `Faq` (`@/content/faqs`: `{question, answer, questionEn, answerEn}`). Static fallback = `import { faqs as staticFaqs } from '@/content/faqs'`.
   ```ts
   import 'server-only';
   import { publicDb } from '@/lib/public-db';
   import { faqs as staticFaqs, type Faq } from '@/content/faqs';
   export interface DbFaqRow { question: string; answer: string; question_en: string | null; answer_en: string | null; }
   export function mapDbFaq(r: DbFaqRow): Faq {
     return { question: r.question, answer: r.answer,
       questionEn: r.question_en ?? r.question, answerEn: r.answer_en ?? r.answer };
   }
   const SELECT = 'question,answer,question_en,answer_en';
   export async function getFaqs(): Promise<Faq[]> {
     try {
       const supabase = publicDb();
       const { data, error } = await supabase.from('faqs').select(SELECT)
         .order('sort_order', { ascending: true });
       if (error || !data || data.length === 0) return staticFaqs;
       return (data as unknown as DbFaqRow[]).map(mapDbFaq);
     } catch { return staticFaqs; }
   }
   ```
4. `app/faq/page.tsx`: make `export default async function FaqPage()`; `const faqs = await getFaqs();` build JSON-LD from that; pass `<FaqContent faqs={faqs} />`.
5. `components/pages/faq-content.tsx`: change to accept `faqs` as a prop (`export function FaqContent({ faqs }: { faqs: Faq[] })`), drop the `import { faqs }` static import; keep `useLocale()` for `en`, pass to `<FaqAccordion items={faqs} en={en} />`.
6. **Seed** the current static FAQs into the DB (so nothing blanks): write a one-off SQL insert (or a `nestjs` seed script) mapping each `content/faqs.ts` entry to `(question, answer, question_en, answer_en, sort_order)`. Insert with `on conflict do nothing`. **Run the seed BEFORE deploying the read change.**

**Test (unit):** `nextjs/lib/faqs-repo.test.ts` — test `mapDbFaq` (EN fallback when `_en` null); assert `getFaqs`'s SELECT string + fallback are correct via a fake. **E2E:** `/faq` renders ≥1 question; switch EN shows English.
**Acceptance:** edit one `faqs` row in the DB → it appears on `/faq` (after revalidate, see T1.5). Static file still present as fallback.
**DO NOT:** delete `content/faqs.ts` (it's the fallback). DO NOT make `FaqContent` fetch data itself (it's a client component — data comes as a prop from the server page).

### T1.2 — Services: DB-first read + chat card label
**DB table (exists, `content.ts:116`):** `services(id, number, title, target_audience, description, icon, sort_order)`.
**Files:** migration `0026` (above adds `description_en`); new `nextjs/lib/services-repo.ts`; edit `nextjs/components/site/service-list.tsx`, `nextjs/app/page.tsx` (home), and the chat card path.

**Steps:**
1. `services-repo.ts` (canonical pattern). View model `Service` (`@/content/services`: `{no, title, description, descriptionEn}`). Map DB `number`(int)→`no`(zero-padded string): `no: String(r.number ?? 0).padStart(2, '0')`.
   ```ts
   export interface DbServiceRow { number: number | null; title: string; description: string | null; description_en: string | null; }
   export function mapDbService(r: DbServiceRow): Service {
     return { no: String(r.number ?? 0).padStart(2, '0'), title: r.title,
       description: r.description ?? '', descriptionEn: r.description_en ?? r.description ?? '' };
   }
   const SELECT = 'number,title,description,description_en';
   // getServices(): order by number asc; fallback staticServices
   ```
2. `service-list.tsx`: the presentational `ServiceListView({ items, en })` is ALREADY prop-driven — keep it. Change the `ServiceList()` wrapper: it's currently `"use client"` importing static `services`. Convert the HOME to fetch server-side. Simplest: make `ServiceList` a thin client wrapper that receives `items` prop; the home page (`app/page.tsx`, already `async`) does `const services = await getServices()` and passes `<ServiceList items={services} />`. (If `ServiceList` must stay reading locale client-side, split: server passes `items`, client wrapper reads `useLocale()` and renders `ServiceListView`.)
3. **Chat inline card** (`components/chat/inline-card.tsx`): the service card still does a static `services.find(...)`. Make the marker carry the label (mirror how the project card was fixed): extend `CardData` service variant to `{ kind: 'service'; id: string; title?: string; description?: string }`; render `card.title ?? id`. Then the BACKEND emitter must include title/desc: in `nestjs/src/chat/marker-parser.ts` (~line 57) the card is built as `{ kind: 'service', id: value }` — enrich it from the retrieved ref (the `RetrievedItem { title, summary }` is available in `system-prompt.ts`; thread title/summary into the card). **If that backend change is too broad, minimal fallback:** keep the DB `getServices()` lookup out of the client — instead have `InlineCard` link to `/#services` with `card.id` as the visible label. Prefer the marker-carries-label approach for correctness.
4. Seed the static services into the DB (same as T1.1 step 6).

**Test:** `services-repo.test.ts` (mapDbService padding + EN fallback). E2E: home `#services` shows ≥1 row; chat service card still renders a label.
**Acceptance:** edit a `services` row → shows on home §Services. Chat service card shows a title.
**DO NOT:** break the SSE card wire shape without updating BOTH the backend emitter and the frontend `CardData` type in the same PR.

### T1.3 — Home "Selected work" mosaic from the DB
**File:** `nextjs/components/site/project-gallery.tsx` (currently imports `featuredProjects` from `content/projects.ts`), `nextjs/app/page.tsx`.
**Design:** the mosaic tiles are positional (`size` a–d by index). Feed the top-4 published DB projects; keep sizes positional.

**Steps:**
1. `app/page.tsx` already computes `all = await getAllProjects()` (DB) and `featured = all.filter(p => p.isFeatured)`. Build the mosaic list from `all` (or `featured` then `all` to fill to 4): take the first 4, map each `Project` → the tile shape.
2. `project-gallery.tsx`: change props from reading static `featuredProjects` to accepting `items: FeaturedProject[]` (or accept `Project[]` and map inside). Map a DB `Project` → tile: `{ slug, name: title, caption: `${title} — ${description}`.slice(0,60), tag: category || technologies[0] || '', tone: <derive>, size: ['a','b','c','d'][i] }`. For `tone`, reuse the deterministic `toneForSlug(slug)` from `nestjs`... NO — that's backend. On the frontend, `Project.tone` already exists (mapDbProject sets `tone: toneForSlug(row.slug)` in `nextjs/lib/project-map.ts`). Use `p.tone`.
3. Keep the positional `sizes` array (`const sizes = ['a','b','c','d']` or the existing `.map(p => p.size)` → now `sizes[i]`).
4. After parity check (the 4 tiles render), **delete** `content/projects.ts` and its import.

**Test:** E2E — home `#work` mosaic shows ≥1 tile linking to `/projects/<slug>`; no console error. **Acceptance:** a new featured DB project appears in the mosaic. **DO NOT** confuse `content/projects.ts` (mosaic) with `content/catalog.ts` (already emptied) — they are different files.

### T1.4 — Certificate `is_featured` honored on read
**Files:** migration `0027_certificates_is_featured.sql`; edit `nextjs/lib/certificate-map.ts`, `nextjs/lib/certificates-repo.ts`, `nextjs/content/site.ts` (the `Certificate` type).
**Steps:**
1. Migration `0027` (the `certificates` table is Supabase-native; add additively):
   ```sql
   alter table public.certificates add column if not exists is_featured boolean not null default false;
   ```
2. `content/site.ts` `Certificate` type: add `isFeatured?: boolean;`.
3. `certificate-map.ts`: add `is_featured?: boolean | null;` to `DbCertificateRow`; in `mapDbCertificate` set `isFeatured: row.is_featured ?? false`.
4. `certificates-repo.ts`: add `is_featured` to the SELECT string; add `.order('is_featured', { ascending: false })` **first** in the order chain (featured pins float to top), before `sort_order` then `ai_rank`.

**Test:** `certificate-map.test.ts` (if exists) — `mapDbCertificate` sets `isFeatured`. E2E: `/about` credentials still open the lightbox. **Acceptance:** set `is_featured=true` on one cert row → it sorts first on home/about. **DO NOT** touch `member_certificates` (a DIFFERENT table).

### T1.5 — Extend the revalidation targets
**File:** `nextjs/lib/revalidate.ts` (+ its caller `nextjs/app/api/revalidate/route.ts`, and the nestjs `RevalidateService`).
**Steps:**
1. `revalidate.ts` has only `revalidationTargets(slug)` for projects. Add sibling functions or extend the target set so a content write can revalidate `/faq`, `/` (services + mosaic + certs), `/about` (certs), `/blog`, `/sitemap.xml`. Keep it a pure list (unit-testable).
2. Whoever writes faqs/services/certs/blog from the admin CMS (server actions) must call `revalidatePath(...)` for the matching paths after the write (mirror how `projects/actions.ts` calls `revalidatePath('/projects')`).

**Test:** unit-test the new target lists. **Acceptance:** a DB write to a FAQ/service/cert shows on the public page without a redeploy (given the read tickets landed). **DO NOT** add `/team/[slug]` here — that's ISR (T2.3).

---

# WAVE 2 — freshness, SEO, GitHub detail parity · effort M

### T2.1 — Blog bilingual + metadata columns
**Files:** migration `0028_blog_posts_bilingual.sql`; edit `nextjs/lib/blog-repo.ts`; Drizzle `nestjs/src/database/schema/showcase.ts`.
**Facts:** `blog_posts` already has `audience` + `kind` (migration 0020). It LACKS `title_en/excerpt_en/content_en`. The static `BlogPost` type (`content/blog.ts`) already has optional `titleEn/excerptEn/contentEn`, but `mapDbPost` drops them.
**Steps:**
1. Migration `0028`:
   ```sql
   alter table public.blog_posts
     add column if not exists title_en text,
     add column if not exists excerpt_en text,
     add column if not exists content_en text;
   -- if members author bilingual posts, also extend the 0015 column grants:
   grant insert (title_en, excerpt_en, content_en), update (title_en, excerpt_en, content_en)
     on public.blog_posts to authenticated;
   ```
2. Drizzle `showcase.ts` `blogPosts`: add `titleEn/excerptEn/contentEn: text(...)`.
3. `blog-repo.ts`: add the 3 cols to `SELECT`, to `DbPostRow` (`title_en: string | null`, etc.), and set them in `mapDbPost`: `titleEn: row.title_en ?? undefined`, `excerptEn: row.excerpt_en ?? undefined`, `contentEn: row.content_en ? row.content_en.split('\n\n').filter(Boolean) : undefined`. Also add `audience`/`kind` to the SELECT + row + mapper if the blog UI will use them (optional for this ticket).

**Test:** `blog-repo.test.ts` — `mapDbPost` maps the EN fields (and null → undefined). **Acceptance:** a DB post with `title_en` shows English when the locale is EN. **DO NOT** make EN required — it's optional (fall back to TH).

### T2.2 — Blog SEO: sitemap + generateStaticParams from the DB
**Files:** `nextjs/app/sitemap.ts`, `nextjs/app/blog/[slug]/page.tsx`.
**Steps:**
1. `sitemap.ts`: replace `import { blogPosts } from '@/content/blog'` with `import { getPosts } from '@/lib/blog-repo'`; inside the (already async) `sitemap()`, `const posts = await getPosts();` and map `posts` for `blogEntries`.
2. `blog/[slug]/page.tsx`: make `generateStaticParams` async and read the DB: `const posts = await getPosts(); return posts.map(p => ({ slug: p.slug }));`. Add `export const dynamicParams = true;` so DB-only new slugs render on demand. Remove the static `import { blogPosts }`.

**Test:** E2E — `/sitemap.xml` contains a DB blog slug; a DB-only blog slug resolves at `/blog/<slug>`. **Acceptance:** a new DB post is in the sitemap + reachable. **DO NOT** drop the static fallback inside `blog-repo` (getPosts still falls back to static on empty/error).

### T2.3 — Team page freshness (ISR)
**File:** `nextjs/app/team/[slug]/page.tsx`.
**Step:** add one line near the top exports: `export const revalidate = 300;` (keep `dynamicParams = true` + `generateStaticParams`).
**Test:** E2E `/team/xenodev` still renders (unchanged). **Acceptance:** an admin edit to member content appears within 5 min without a redeploy. **DO NOT** build realtime team-page invalidation (over-engineering).

### T2.4 — GitHub live detail beyond MangaDock (DB-derived repo list)
**Files:** `nestjs/src/github/github.config.ts` (the `GITHUB_SHOWCASE_REPOS` constant) + `nestjs/src/github/github-refresh.service.ts` (the consumer).
**Facts:** `GITHUB_SHOWCASE_REPOS = [{owner:'Slow-Inc', repo:'MangaDock'}]` (github.config.ts:25). Consumed as the `showcaseRepos` constructor default in `GithubRefreshService`; iterated at refresh.service.ts:96 → `this.detail.syncRepoDetail(owner, repo)`.
**Steps:**
1. Add a method to the snapshot/DB read path that returns `{owner, repo}[]` for published github-backed projects: `select gh_owner, gh_repo from projects where source='github' and status='published' and gh_owner is not null and gh_repo is not null`. (Use the existing Drizzle DB handle in a store, mirroring `pg-generate.store.ts`.)
2. In `GithubRefreshService.refreshAll()`, before the `for (const {owner, repo} of this.showcaseRepos)` loop, load the DB list; iterate that (union with the constant so MangaDock always included). Keep the try/catch per repo (fail-soft) + ETag behavior in `syncRepoDetail` unchanged.
3. Cap the set defensively (e.g. first 50) and `log` if truncated — sequential to bound GitHub API calls.

**Test:** nestjs unit — a fake DB returning 2 repos → `refreshAll` calls `syncRepoDetail` for both. **Acceptance:** after one cron/refresh, ≥2 non-MangaDock projects show a live overlay on `/projects/[slug]`. **DO NOT** fetch detail for `status!='published'` or hidden repos.

---

# WAVE 3 — simplified self-updating case study · effort L

> Depends on Wave 2 (T2.4 gives non-MangaDock repos a cached README/detail snapshot to read).

**Reuse (do NOT rebuild):**
- Generation: `buildGeneratePrompt(ctx)` + `parseGeneratedContent(raw)` (`github-generate-client.ts`) → a `GeneratedContent { title, titleEn, description, content, category, tags, technologies }` from ONE README, with the `<<<UNTRUSTED_README>>>` fence + `validateTechnologies` guard.
- README source: `GithubReadService.getRepoReadme(owner, repo)` → `{ data, stale }` where `data` is `{ markdown, sha }` (decoded by `parseReadme`). Delta gate = compare that `sha` vs `projects.readme_sha`.
- Secret guard: `constantTimeEqual(secret, process.env.GITHUB_REFRESH_SECRET)` from `./webhook-verify` (copy from `github-generate.controller.ts`).

**DROP (do NOT use):** the whole map-reduce (`runMapReduce`, `curateDocuments`, `computeManifestHash`, `project_documents` ingestion), 3 audiences, `generation_jobs` ledger, GitHub App.

### T3.1 — The simplified generate service + persist
**File (new):** `nestjs/src/github/case-study-simple.ts` (+ a Pg store).
**Steps:**
1. Service `CaseStudySimpleService` with deps `{ readme: GithubReadService, llm: LlmService, store }`:
   ```
   async generateForProject(project: {id, slug, ghOwner, ghRepo, readmeSha, description, ...}): Promise<{generated:boolean}>
     const rr = await readme.getRepoReadme(ghOwner, ghRepo); if (!rr?.data) return {generated:false}
     const { markdown, sha } = rr.data as ReadmeSnapshot
     if (project.readmeSha && project.readmeSha === sha) return {generated:false}   // delta gate
     const ctx: GenerateContext = { readmeSha: sha, readme: markdown, languages: {}, description, topics: [] }
     const gen = parseGeneratedContent(await llm.complete(buildGeneratePrompt(ctx)))
     await store.publishCaseStudy(project.id, project.slug, gen, sha)               // one txn (T3.1 step 2)
     return {generated:true}
   ```
2. Store `publishCaseStudy(projectId, slug, gen, sha)` — ONE transaction (mirror `pg-case-study.store.ts` upsert + `pg-generate.store.ts` owner guard):
   ```sql
   -- a) upsert the case-study blog post, PUBLISHED (ADR 0011 auto-publish), single audience='business':
   insert into blog_posts (slug, title, excerpt, content, tags, project_id, audience, kind, source, owner, published_at)
   values (${slug}-case-study, ${gen.title}, ${gen.description}, ${gen.content}, ${gen.tags}, ${projectId},
           'business', 'case_study', 'github', 'auto', now())
   on conflict (project_id, audience) where kind='case_study'
   do update set title=case when blog_posts.owner='auto' then excluded.title else blog_posts.title end,
                 excerpt=case when blog_posts.owner='auto' then excluded.excerpt else blog_posts.excerpt end,
                 content=case when blog_posts.owner='auto' then excluded.content else blog_posts.content end,
                 tags=case when blog_posts.owner='auto' then excluded.tags else blog_posts.tags end,
                 published_at=coalesce(blog_posts.published_at, now());
   -- b) mirror the narrative into projects.content (owner-guarded) so RAG/chunkProject sees it:
   update projects set content = case when content_owner='auto' then ${gen.content} else content end,
                       readme_sha = ${sha}, generated_at = now()
   where id = ${projectId} and source='github';
   ```
   `readme_sha` is updated **inside the same txn, after** the blog write — so a mid-write failure leaves the old SHA and retries next hour.
**Guardrails:** `audience='business'` is REQUIRED (part of the `(project_id, audience)` unique key — a null would break idempotency). Slug is `${slug}-case-study`. published_at = now() (auto-publish per ADR 0011) — only because the repo is public + output passed the injection-delimit/validation.
**Test (nestjs):** unit with a fake readme (unchanged sha → 0 LLM calls; changed sha → 1 call → store.publishCaseStudy invoked). Capture the emitted SQL (mirror the existing `pg-generate.store` SQL-capture test style).

### T3.2 — Controller + endpoint
**File (new):** `nestjs/src/github/case-study-simple.controller.ts`. **Copy the shape of `github-generate.controller.ts` verbatim** (same `@Controller('github')`, `@Post('generate-case-studies')`, `x-refresh-secret` guard, dry-run default with a capturing store).
```
@Post('generate-case-studies')
async run(@Headers('x-refresh-secret') secret, @Body() body: { apply?: boolean }) {
  if (!expected || !constantTimeEqual(secret, expected)) throw new UnauthorizedException()
  const projects = await store.listPublishedGithubProjects()   // select id,slug,gh_owner,gh_repo,readme_sha,description
  let generated = 0
  for (const p of projects) { const r = await (body.apply ? svc : dryRunSvc).generateForProject(p); if (r.generated) generated++ }
  return { candidates: projects.length, generated, applied: Boolean(body.apply) }
}
```
Sequential loop, fail-soft per project (try/catch, continue). Dry-run by default (report would-generate counts).
**Test:** e2e-style (nestjs) — 401 without secret; 200 with. **Acceptance:** `POST /github/generate-case-studies` with the secret + `{"apply":true}` publishes case studies for changed repos.

### T3.3 — Module wiring
**File:** new `nestjs/src/github/case-study-simple.module.ts` (mirror `github-generate.module.ts`: `imports: [DatabaseModule, LlmModule]`, `controllers: [CaseStudySimpleController]`, providers for the store + service). Register it in `nestjs/src/app.module.ts` `imports` array (next to `GithubGenerateModule`).
**Acceptance:** `bun run build` (nestjs) green; the route is listed on boot.

### T3.4 — Cron leg
**File:** `.github/workflows/github-refresh-cron.yml`.
**Step:** add a step AFTER "Sync member public repos" and BEFORE "Refresh AI display-rank" (so new blog content is ranked in the same run). Copy an existing step verbatim, change the URL + message:
```yaml
      - name: Generate case studies from changed READMEs
        env:
          REFRESH_SECRET: ${{ secrets.BACKEND_REFRESH_SECRET }}
          BACKEND_URL: ${{ vars.BACKEND_URL || 'https://t4-fastwork-nestjs.vercel.app' }}
        run: |
          [ -z "$REFRESH_SECRET" ] && { echo "secret unset — skip"; exit 0; }
          code=$(curl -sS -o /tmp/body -w '%{http_code}' -X POST \
            -H "x-refresh-secret: $REFRESH_SECRET" -H "Content-Type: application/json" \
            -d '{"apply":true}' "$BACKEND_URL/github/generate-case-studies")
          echo "POST .../generate-case-studies -> HTTP $code"; cat /tmp/body 2>/dev/null || true; echo
          case "$code" in 2*) : ;; *) echo "::warning::case-study gen failed HTTP $code (non-blocking)" ;; esac
```
Also: after a successful generate, trigger blog revalidation (the nestjs service can call `RevalidateService` fire-and-forget like `rank.controller.ts` does for projects — add a `revalidateBlog()` target).
**Acceptance (canary):** manually `workflow_dispatch` the cron; verify exactly-one-LLM-call per changed repo (unchanged repos: zero), a published `blog_posts` row appears, `/blog` shows it, an admin edit of that post flips `owner='human'` and the next run leaves it unchanged.

### T3.5 — RAG (no new chunker)
Because the narrative is mirrored into `projects.content` (T3.1), the EXISTING `chunkProject` + the deterministic per-project chat pick it up on the next RAG ingest. **Confirm** the RAG ingest re-runs after a project write (it already does per ADR 0004 heal/ingest). **DO NOT** add `chunkBlog`/`sourceType='blog'` (dropped).

---

# WAVE 4 — retire the dormant pipeline · effort S (AFTER Wave 3 stable on prod)

### T4.1 — Remove the map-reduce wiring
**Steps:** delete `CaseStudyModule` from `app.module.ts` and the map-reduce runtime files (`github-case-study.ts` runMapReduce + `github-case-study-persist.ts` + `pg-case-study.store.ts` + `github-case-study.module.ts`) ONLY IF the simplified path (Wave 3) does not import any of them. **If T3 reused `pg-case-study.store.ts`'s `upsertCaseStudies`, keep that file** and delete only the map-reduce generator. Close the now-obsolete issues (#66/#67/#68/#70/#81 — reference ADR 0013).
**Leave tables** `project_documents`/`generation_jobs` in place (non-destructive). Delete `content/*.ts` DATA files (`faqs.ts`, `services.ts`, `projects.ts`, `blog.ts`) ONLY after each has passed its DB parity gate — otherwise keep as fallback.
**Acceptance:** `bun test` + `bun run build` + `bun run e2e` all green; no runtime references the deleted map-reduce.

---

## Sequencing / dependency summary

- **Wave 0** blocks nothing technically but do it first (prevents building the obsolete pipeline).
- **Wave 1** tickets are independent of each other — can be done in parallel by different agents (T1.1, T1.2, T1.3, T1.4 touch disjoint files; T1.5 last).
- **Wave 2:** T2.1 (blog cols) before T2.2 (blog SEO). T2.3 + T2.4 independent.
- **Wave 3** depends on T2.4 (repos need cached READMEs). T3.1→T3.2→T3.3→T3.4 in order; T3.5 is a verify.
- **Wave 4** only after Wave 3 is stable in prod.

## Cross-cutting guardrails (repeat)

Seed-before-switch (never blank a page) · owner='auto' guard on all generated writes · one-transaction writes with SHA-last · additive/idempotent migrations, applied via the supported path (never hand-edit tracking) · TDD + `bun run e2e` per frontend change · `/security-review` on any authz/generation/secret change · bilingual issue/PR bodies.
