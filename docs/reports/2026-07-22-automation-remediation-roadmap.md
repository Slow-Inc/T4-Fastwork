# Automation Remediation Roadmap — 2026-07-22

**Goal (the documented North Star, VISION §1):** a showcase that *adjusts itself automatically
from GitHub* so the team doesn't hand-maintain projects — AI curates, generates copy, and ranks;
human editing is an **optional override on top**, not a required step.

**Method:** close the gap between that North Star and today's reality (from the tech-debt audit +
the two spec/ADR reads). Right-sized for a **5-person portfolio** — the heavy CASE/ADR-0009
GitHub-App + map-reduce + 3-audience pipeline is deferred to a later, optional phase; the core
"self-updating showcase" is reachable with just **cron-chaining + an automated safety gate**.

## Reality vs North Star
```
North Star:  push repo → (auto) curate → generate copy → rank → publish   [admin optional]
Today:       refresh ✅auto → curate 🔧 → member-sync 🔧 → generate 🔧 → case-study ❌ → RAG ❌ → rank 🔧
             (only leg 1 is scheduled; everything downstream is manual or unbuilt)
```

## Hard constraints the plan must honor (from the ADRs — do NOT violate)
1. **No auto-publish without a safety gate** (ADR 0009): scan generated output for secrets /
   customer-data / prompt-injection; on fail keep the last safe revision. → we make the gate
   AUTOMATED (scan-then-publish), which also satisfies the owner's "no manual approval" wish.
2. **Fix the publish-state leak FIRST** (ADR 0009 D5.1): every public read must filter
   `status='published'`, not just `published_at` — else a draft leaks. Prerequisite to any auto-gen.
3. **Generated narrative = immutable revisions + overrides; project facts/taxonomy = `*_owner`**
   (ADR 0009 D4 / ADR 0005): never clobber a human edit; regeneration only touches `auto` fields.
4. **Rank orders DISPLAY not content; offline via `/rank/refresh`, cron not per-push** (ADR 0008).
5. **Migrations additive-only; single prod pooler DB (no dev DB)** (runbook). Guard prod writes.
6. **Kill-static = repo-wide sweep w/ per-surface parity gate + two-deploy last-known-good**
   (ADR 0009 D5) — never one-deploy, never blank `/projects`.
7. Member repos stay **admin/member-selected** (the deliberate override layer) — already decided
   ("pull all, choose in admin"); org repos auto-curate by rule.

## Decisions — RESOLVED by the owner (2026-07-22)
- **D-A → AUTO-PUBLISH IF PUBLIC.** A repo being public *is* the publish authorization — no human
  approval, no hold-for-review. **This reverses ADR 0009's "no auto-publish without the safety
  gate" → needs a NEW ADR** recording the decision + rationale. Reconciliation: the publish
  *permission* comes from public-visibility, but the automated **input/output validation** stays
  (delimit untrusted README against prompt-injection; validate `technologies[]` vs repo languages
  and `category` vs taxonomy against hallucination; keep the last safe revision if generation
  fails). These are code-robustness, not a human gate — zero friction — and they cover the one risk
  "public = permission" does NOT: a third party injecting content via a PR to a member's public
  README. **Accepted residual risk:** a public repo that leaks a secret in its README could have it
  echoed into generated copy (it's already public, but the site amplifies it) — a cheap secret-regex
  redact is offered as an optional automated guard, not a gate.
- **D-B → FULL case-study pipeline.** GitHub App (org + member installs) + push-webhook + map-reduce
  + 3-audience (business/semitech/developer) + immutable revisions/overrides, per ADR 0009. The
  GitHub App moves OUT of the SKIP list and INTO Phase 4.

---

## Phases

### Phase 0 — Deploy what's built + close the safety leak  *(unblocks everything)*
- **0.1 Publish-state fix (P0 security, ADR 0009 D5.1):** audit every public read
  (`projects-repo`, `member-content-repo`, `blog-repo`, `certificates-repo`) — filter
  `status='published'` / `published_at not null`. `getAllProjects` already does; verify the rest +
  add an E2E that a draft never leaks. **Must land before any auto-publish.**
- **0.2 Fix the 5 static-fallback masks** (tech-debt P0 #1): `blog-repo:42`, `certificates-repo:24/28`,
  `members-repo:24/48`, `site-stats:36/37` — empty DB result must not resurrect the static seed
  (check each table is populated first so no live section blanks).
- **0.3 Deploy the flat-authz branch** — apply `0023/0024/0025` (preflight the dup-url + status
  checks) + deploy the curate/member-sync/generate endpoints. **Human gate:** merge + `bunx vercel --prod`.
- **Exit:** current built work is LIVE + safe; the 4 operator endpoints exist in prod.

### Phase 1 — Wire the automation chain into cron  *(the core North Star, minimal infra)*
- Add steps to `.github/workflows/github-refresh-cron.yml` (after `/github/refresh` succeeds):
  `POST /github/curate {apply:true}` → `POST /github/sync-member-projects {apply:true}` →
  `POST /rank/refresh`. Sequential, secret-guarded, fail-soft per step (log + continue).
- Wire `mapRepoMetadata` (`homepageUrl→live_url`) into the curate/refresh path (audit #17).
- **Exit:** a new org repo auto-becomes a draft project; member repo choices auto-refresh; ranks
  auto-update — **zero manual endpoint runs.** (Member-repo *selection* + new-project *publish*
  still gated — closed in Phase 2.)

### Phase 2 — Auto content-gen + automated safety gate  *(removes the last manual step for projects)*
- Bind `ContentGenerateService`'s `LlmClient`→`LlmService` (`CUSTOM_OPENAI_*`); assemble context
  from stored snapshots (README/languages/topics) instead of the request body (currently manual).
- Chain generate into the cron, **delta-gated** (skip if `readme_sha`/manifest unchanged → 0 LLM cost).
- **Publish policy (D-A):** a **public** repo's generated copy **auto-publishes** — no human step.
  Keep the automated validation (delimit untrusted README vs injection; validate `technologies[]`
  vs repo languages + `category` vs taxonomy vs hallucination; keep last safe revision on gen
  failure) — code robustness, not a gate. Optional cheap secret-regex redact. Respect provenance
  (`*_owner='auto'` only; never touch a human-edited field). **Write the D-A ADR + run
  `/security-review`.**
- **Exit:** push a public repo → its project copy rewrites + publishes itself, with no admin step.

### Phase 3 — Kill the static catalog  *(finish "nothing hardcoded", repo-wide)*
- Per ADR 0009 D5 + disconnect-audit's 17 surfaces: make each read DB-only with a **parity gate**
  (seed/verify DB has ≥ static content) + **two-deploy last-known-good** cutover. Surfaces:
  projects list/detail, home Featured/Selected-work, blog, certificates, faqs, services, recommend,
  sitemap (add dynamic projects), member projects/certs, chat marker resolver.
- **Exit:** the site renders 100% from DB/GitHub; `content/*.ts` seeds are fallback-only.

### Phase 4 — Case studies + RAG-from-GitHub  *(FULL pipeline, D-B=full; the ambitious phase)*
- **GitHub App** (org + each member install) + push webhook → 202 → queued worker (supersedes
  ADR 0003 PAT+polling); cron reconcile heals missed deliveries. *(Now in scope per D-B.)*
- **#66 producer worker:** on push, fetch tree at `after` → rebuild `project_documents` per-file
  `.md` manifest (`blob_sha`, `content_hash`); hash with `prompt_version`; **skip LLM if manifest
  hash unchanged**.
- **Map-reduce generate:** Stage1 map per `.md` (extract cached by `blob_sha` in the `extract jsonb`
  col, migration 0022) → Stage2 reduce ×3 audiences (business/semitech/developer). Worker calls
  `ContentGenerateService` directly (no HTTP self-call); `POST /github/generate` stays operator
  dry-run/retry. Immutable `blog_post_revisions` + `blog_post_overrides` (render `override ?? latest`);
  atomic **promote-if-still-latest-manifest**. Auto-publish public (D-A) after validation.
- **RAG:** `chunkBlog()` — ingest published case studies into `document_embeddings (sourceType='blog')`
  so global `/chat` can cite them (audit #8). Per-project chat stays deterministic (FR-09), not project-RAG.
- **Render:** project detail shows the case study with an audience switcher (one URL, `developer`
  canonical for crawlers — resolve the CASE:138-144 open question).
- **Exit:** push a public repo → AI rewrites its native 3-audience case study, publishes it, and chat
  learns it — end to end, no admin step.

### Phase 5 — Cleanup + small correctness  *(cheap, anytime)*
- Delete orphan `githubLoginFromUser`; add `db:seed:*` scripts (3 manual seeders) to package.json.
- Add `extract jsonb` to the Drizzle `projectDocuments` schema (lags migration 0022).
- `PgGenerateStore.applyPatch` — write generated category/tags/technologies (currently dropped).
- Add member-table kinds to the rank job (member_projects/certs read `ai_rank` nothing writes), or
  stop ordering by it.
- Owner-qualify project slugs / key by `(gh_owner, gh_repo)` (narze collision).

## Explicitly SKIP (over-engineering for this scale)
Durable webhook delivery-state machine (claim-and-complete retry), replacing serverless
fire-and-forget with a heavyweight job runner, a nestjs e2e suite. The hourly cron + heal-on-read +
manual retry endpoints are sufficient at 5-person scale. *(GitHub App push worker is now IN scope —
Phase 4, per D-B=full.)*

## Sequencing rationale
Phase 0 must precede all (safety leak + deploy). Phase 1 delivers the biggest owner-visible win
(self-updating repos/ranks) with almost no new code. Phase 2 removes the last manual project step.
Phase 3 is the repo-wide sweep (bigger, do after 1–2 prove the DB path). Phase 4 is the ambitious,
separable case-study bet. Phase 5 is cheap cleanup, fit in anytime. Each phase = its own PRD +
issues + TDD per the T4 workflow — **not one-shot** (clear-backlog-plan ordering principle).
