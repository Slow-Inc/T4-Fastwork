# Clear-backlog execution plan (2026-07-16)

> **Execution status (2026-07-16 AFK run):** Phases 1–5 partially cleared unattended.
> **Shipped + verified** (branch `chore/clear-backlog-afk`, 6 commits `f53ca22..2c87dd5`):
> E1, E2 (cleanup) · C4 (hermetic test) · C2 (lint exit 0) · C3 (R3 refresh test) ·
> C5 (2 stale /team/xenodev e2e tests, discovered mid-run) — all green (nestjs 153,
> nextjs unit, e2e 52) + passed an adversarial clink/codex review (3 findings fixed).
> **Parked:** #36 (architecture/seam decision — see ledger) · B1 (issue-closing, needs
> user go) · C1 (prod RLS, needs approval) · A2/A3/A4 (need grill→PRD) · D1/D2 (dashboard).
> **Discovered:** nestjs prettier `--fix` drift (23 files, stashed) needs its own reviewed
> commit. Full digest in the session hand-off.

Turns every open item from `2026-07-16-backlog-audit.md` into a sequenced, verifiable
plan. Companion to that audit (which is the *inventory*; this is the *how + order*).
Follows T4: PRD→issues→PR gate, TDD, `bun run e2e` on every FE change, `/security-review`
on any auth/RLS path, bilingual only on the GitHub tracker.

> **สรุปไทย:** แบ่งงานค้าง 16 อย่างเป็น **6 เฟส** เรียงจากปลอดภัย+คุ้มค่าที่สุดไปหาเสี่ยง/ใหญ่ที่สุด.
> เฟส 1–4 ปิดจบได้จริงใน session สั้นๆ (bug + cleanup + ปิด issue + tech-debt). เฟส 5 (RLS prod)
> ต้อง security-review เต็ม. เฟส 6 (3 ฟีเจอร์ใหญ่) แต่ละตัวต้อง grill→PRD→issues ก่อนลงโค้ด —
> ห้าม one-shot. แต่ละ item มีเกณฑ์ "เสร็จเมื่อ" ชัดเจน.

Status key: ⬜ not started · 🔷 needs its own PRD/grill first · ⚠️ prod-risk gate.

---

## Phase 1 — Bug fix (start here)

### 1.1 ⬜ #36 — in-progress AI reply lost on popup ↔ /chat switch
- **Goal:** switching surfaces mid-stream keeps the partial reply instead of leaving a
  blank `ผู้ช่วย AI` turn.
- **Approach:** `debug-mantra` first (reproduce → trace fail path → falsify hypothesis).
  Root cause already traced: shared `SHARED_CHAT_KEY` sessionStorage + per-instance SSE +
  no `AbortController`. Likely fix: persist the streaming buffer to the shared key as it
  arrives (or an `AbortController` + resume), so the other mount rehydrates the in-flight
  turn. Confirm the mechanism before coding.
- **TDD seam:** the conversation-store / stream-buffer boundary (`lib/chat-conversations.ts`
  or the streaming reducer) — unit-test that an interrupted stream persists + rehydrates.
- **Verify:** `bun test` (unit) + `bun run e2e` new case: start a reply, switch popup↔/chat
  mid-stream, assert the partial text survives + finishes. `/scrutinize` (traces the shared-key
  path). No auth touched → no security-review.
- **Size:** S. **Record:** `/post-mortem` after it lands (pre-existing since #31).

## Phase 2 — Trivial cleanup (bundle into the Phase 1 nestjs/next touch or a tiny PR)

### 2.1 ⬜ E1 — remove dead `StubRetrievalService`
- **Goal:** delete the unused stub + fix the stale `#8` comment; real `DrizzleRetrievalService`
  stays wired (`chat.module.ts:27`).
- **Approach:** delete `StubRetrievalService` class + the "Placeholder until #8" comment in
  `nestjs/src/rag/retrieval.service.ts` (keep the `RetrievalService` interface + `RETRIEVAL_SERVICE`
  symbol — both still used). Grep to confirm zero references before deleting.
- **Verify:** `bun test` (nestjs) + `bun run build` green. **Size:** trivial.

### 2.2 ⬜ E2 — fix stale `DatabaseModule` comment
- **Goal:** comment says "Not yet imported by AppModule"; it's imported by `rank.module.ts:16`
  + `github.module.ts:29`. Correct the doc comment (`database.module.ts:12-13`). **Size:** trivial.

## Phase 3 — Bookkeeping: close shipped issues (needs user go — outward-facing)

### 3.1 ⬜ B1 — close 16 shipped-and-verified issues with evidence
- **Goal:** the tracker reflects reality; no finished work left open.
- **Approach:** for each, a bilingual closing comment (EN + TH mirror) citing the shipping
  commit SHA + verification, then close with a stated reason. Batch:
  - **#37–#43** chat app-shell P0–P5 → completed-with-evidence (commits per ledger:
    `dc0fc3e`, `9af0f0f`, P2→next, P3/P4/P5 next commits; all e2e green + merged in PR #34).
  - **#35** → closed as *subsumed by #42* (vision/image upload shipped there).
  - **#33** → closed as *subsumed by epic #37*.
  - **#16–#24** → closed as *superseded by #25* (serverless-native freshness; all 3 event
    sources live + verified — see `realtime-freshness-runbook.md`).
- **Verify:** `gh issue list --state open` no longer shows them; ledger updated to mark closed.
- **Gate:** confirm with user before mass-closing (outward-facing). **Size:** S (mechanical).

## Phase 4 — Tech debt, no prod risk

### 4.1 ⬜ C2 — nestjs lint ~692 errors (typescript-eslint config)
- **Goal:** `bun run lint` clean in `nestjs/`. Type-resolution fails across `test/**`.
- **Approach:** fix the eslint/tsconfig so `test/**` is covered by a parserOptions project
  (or excluded from type-aware rules). Repo-wide config, no source logic change.
- **Verify:** `bun run lint` (nestjs) exits 0; `bun test` still green. **Size:** S–M.

### 4.2 ⬜ C4 — make `github.service.spec.ts` hermetic
- **Goal:** "omits Authorization when no token" passes locally regardless of `nestjs/.env`.
- **Approach:** isolate the env in-test (clear `GITHUB_TOKEN` for that case) so Bun's
  auto-loaded `.env` can't leak a real token in.
- **Verify:** `bun test` passes with a real `GITHUB_TOKEN` present. **Size:** trivial.

### 4.3 ⬜ C3 — e2e test for the #25 R3 "double" UI-swap
- **Goal:** an automated test that a Realtime broadcast → `updateTag` → UI swap actually fires.
- **Approach:** component test injecting a fake Realtime client that emits a change, asserting
  `refreshLiveTags` + `router.refresh` fire (friction: mocking `next/navigation` + the
  `'use server'` `next/cache` import under bun/happy-dom) — OR an integration e2e that bumps a
  snapshot `updated_at` via SQL and asserts the open page updates.
- **Verify:** the new test is red without R3 wiring, green with it. **Size:** M (mocking friction).

## Phase 5 — ⚠️ Security: RLS on public tables (prod gate)

### 5.1 ⬜⚠️ C1 — enable RLS + anon policies on ~13 public tables
- **Goal:** close `rls_disabled_in_public` on `faqs, services, projects, categories, tags,
  technologies, blog_posts, certificates, conversations, messages, project_tags,
  project_technologies, document_embeddings` + `sensitive_columns_exposed` on
  `conversations.session_id`, **without breaking public frontend reads.**
- **Approach:** file an issue first (security label, critical/major). Backend reads via the
  superuser pooler (bypasses RLS) so writes are safe; the risk is the anon frontend reads.
  Per table: enable RLS + an explicit anon `SELECT` policy scoped to the columns/rows the
  public site already shows (mirror the pattern from ADR 0007 + the member-content RLS).
  `conversations.session_id`: restrict column exposure. Draft as a Supabase migration.
- **Verify:** apply to a branch/staging first if possible; `get_advisors` shows the warnings
  cleared; **`bun run e2e` full public-site suite green** (proves no public read broke);
  full `/security-review` before apply-to-prod. **Size:** M–L. **Gate:** explicit user
  approval before prod apply (shared infra, reversible-but-risky).

## Phase 6 — 🔷 Large features (each: grill → PRD → issues → TDD; do NOT one-shot)

> These are multi-day. The plan here is the *entry step* for each, not the implementation.
> Sequence per the vision PRD: finish B (ranking pervasive) → then the autonomous pipeline → RAG.

### 6.1 🔷 A2 — #45/#51: project CONTENT static→DB migration (ranking pervasive)
- **Open decision (must resolve in grill):** migrate the whole projects catalog into DB now
  vs keep ranking on DB-backed surfaces only (per ledger B5 note + ADR 0008). This is the
  crux — parity of `/projects`, home Featured, Selected-work against `content/catalog.ts`.
- **Entry step:** `/grill-with-docs` against ADR 0008 + the ai-display-ranking spec →
  `/to-prd` (scope: M2M tech/tags tables, `description_en` + tone cols, category reconcile,
  a parity harness static↔DB) → `/to-issues`. Then TDD per issue.
- **Verify (per issue):** parity snapshot (DB output === current static render) before wiring
  ranking; then reorder-on-ai_rank e2e on all 3 surfaces. **Size:** L.

### 6.2 🔷 A3 — autonomous content-gen pipeline (P3)
- **Scope:** `GenerateStore` (Drizzle) + bind `LlmClient`→`LlmService` (`CUSTOM_OPENAI_*`) +
  refresh-cron wiring + draft-approve CMS action (`approved_at` col already exists,
  `content.ts:79`). Pure reconcile/guard logic already shipped (PR #29).
- **Entry step:** file an issue (none exists) → grill the guardrails (cost, determinism,
  draft-gate) → PRD → TDD. Depends conceptually on the approve UI pattern from C4b (member CMS).
- **Verify:** end-to-end on a single repo: sync → generate draft → admin approve → published,
  with the tech-guard + delta reconcile covered by tests. **Size:** L.

### 6.3 🔷 A4 — #30 RAG-from-live-GitHub (freshness half)
- **Scope:** chat answers grounded in *fresh* GitHub data. Stats-fix half shipped; the
  RAG-freshness half never started. Re-ingest / freshen embeddings from the live snapshots.
- **Entry step:** re-file (issue #30 is closed) → grill how fresh + at what trigger (heal-on-read
  vs cron re-embed) → PRD → TDD.
- **Verify:** ask the chat a question answerable only from a just-changed repo; answer reflects
  the change. **Size:** M–L.

## Phase 7 — Hand back to the developer (dashboard/env)

- **D1 ⬜** set `ADMIN_EMAILS` in `nextjs/.env.local` + Vercel (email-fallback admin; GitHub
  `is_admin` admins already work).
- **D2 ⬜** flag teammates `is_admin` at `/admin/members` (only `xenodev` bootstrapped).
- I can prep exact commands/values; the actual dashboard/env write is the developer's.

## Phase 8 — Process (optional, decide)

- **E3 ⬜** T4 memory-model gap: no `DONE.md` ship log, no vault `Home.md`. Either adopt them
  or record (in memory) that this repo intentionally runs ledger-only + personal memory.

---

## Ordered worklist (copyable)

1. **#36** bug (Phase 1) — start now, TDD + e2e.
2. **E1, E2** cleanup (Phase 2) — bundle with #36's nestjs touch.
3. **B1** close 16 issues (Phase 3) — *after user go*.
4. **C2 → C4 → C3** tech-debt (Phase 4).
5. **C1** RLS (Phase 5) — issue + policies + full security-review + e2e, *user-approved prod apply*.
6. **A2 → A3 → A4** (Phase 6) — each grill→PRD→issues→TDD, one at a time.
7. **D1, D2** hand-back (Phase 7). **E3** process (Phase 8).

Every code change maps to an issue before its PR; every FE change runs `bun run e2e`; every
auth/RLS change runs `/security-review`. Update `OPEN-WORK-LEDGER.md` + append `DONE.md`
(if adopted) as each item lands.
