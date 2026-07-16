# Backlog audit — possibly-dropped work (2026-07-16)

**Local-only audit** (not filed to GitHub). Purpose: a single skimmable list of
everything still open — including items that live *only* in MD / code comments and
could silently fall through. Cross-checked against `docs/OPEN-WORK-LEDGER.md`,
`gh issue list --state open`, all 33 files under `docs/`, and code TODO/placeholder
markers.

> **สรุปไทย (TL;DR):** งานที่ยังไม่เสร็จมี **13 อย่างหลัก** (4 ฟีเจอร์ · 1 งานปิด 16 issues ·
> 3 tech-debt · 2 human-only) + จาก audit รอบนี้เจอ **จุดตกหล่นเพิ่ม 3 อย่าง** ที่ไม่ได้อยู่ใน
> ledger ชัดๆ (stale dead code 2 จุด + โครงสร้าง memory ที่ T4 คาดหวังแต่ยังไม่มี). ทุกอย่าง
> เขียนไว้ที่นี่ local ตามที่สั่ง — ยังไม่เปิด GitHub issue.

Legend: 🟢 tracked (has an open issue) · 🔴 untracked (MD/code only, no issue) ·
🆕 newly surfaced by this audit.

---

## A — Feature / code work

| ID | Item | Size | Tracking |
|---|---|---|---|
| A1 | 🟢 Bug: in-progress AI reply lost (blank assistant turn) when switching popup ↔ `/chat` mid-stream. Root cause traced: shared `SHARED_CHAT_KEY` sessionStorage + per-instance SSE + no `AbortController`. | S | **#36** |
| A2 | 🟢 Apply AI display-ranking to the home Featured / Selected-work / `/projects` surfaces — requires the project **CONTENT** static→DB migration (M2M tech/tags, `description_en` + tone cols, category reconcile). Parity-sensitive. | L | **#45 / #51** |
| A3 | 🔴 P3 autonomous content-gen wiring: `GenerateStore` Drizzle impl + bind `LlmClient`→`LlmService` (`CUSTOM_OPENAI_*`) + refresh-cron + draft-approve CMS action. `content.ts:79` `approved_at` col exists but the approve action isn't built. | L | none |
| A4 | 🔴 #30 RAG-from-live-GitHub — chat answers grounded in fresh GitHub data. Stats-fix half shipped; RAG-freshness half never started. (#30 itself is closed.) | M–L | none |

## B — Bookkeeping (close shipped-and-verified issues)

| ID | Item | Count | Tracking |
|---|---|---|---|
| B1 | 🟢 Close issues whose work is shipped + verified (ledger marks them "pending confirm-to-close"): **#37–#43** (chat app-shell P0–P5), **#35** (subsumed by #42), **#33** (subsumed by #37), **#16–#24** (GitHub team epic, superseded + activated by #25). | 16 issues | listed |

## C — Tech debt / security (all 🔴 untracked)

| ID | Item | Risk |
|---|---|---|
| C1 | 🔴 Supabase advisors: `rls_disabled_in_public` on ~13 public tables (`faqs, services, projects, categories, tags, technologies, blog_posts, certificates, conversations, messages, project_tags, project_technologies, document_embeddings`) + `sensitive_columns_exposed` on `conversations.session_id`. Pre-existing. Backend reads via the superuser pooler (bypasses RLS), so enabling RLS needs explicit anon policies or public reads break. Needs `/security-review`. | High (prod) |
| C2 | 🔴 nestjs lint ~692 errors on HEAD — typescript-eslint type-resolution fails across `test/**`. Repo-wide config fix. New source files are clean. | Low |
| C3 | 🔴 #25 R3 "double" UI-swap has no end-to-end automated test — pure seams + `<LiveSnapshot>` mount are covered, but nothing simulates a real Realtime broadcast → `updateTag` → UI swap. Verified by reasoning/manual only. | Low |
| C4 | 🔴 `github.service.spec.ts` "omits Authorization when no token" fails locally — Bun auto-loads `nestjs/.env` (real `GITHUB_TOKEN`); passes in CI + with token unset. Make it hermetic. | Low |

## D — Human / dashboard only (agent cannot fully do)

| ID | Item |
|---|---|
| D1 | 🔴 Set `ADMIN_EMAILS` in `nextjs/.env.local` + Vercel — `isAllowedAdmin` fails closed on empty (commit `c49a32f`), so `/admin` email-fallback is inaccessible until set. GitHub-login admins (`members.is_admin`) still work. |
| D2 | 🔴 Flag other teammates `is_admin` at `/admin/members` (only `xenodev` bootstrapped). Optional `seed-app-admins.ts` for the email fallback. |

## E — 🆕 Newly surfaced by this audit (not in the ledger)

| ID | Item | Anchor | Risk |
|---|---|---|---|
| E1 | 🆕🔴 **Stale dead code:** `StubRetrievalService` + interface comment reference issue **#8 which is CLOSED**; the real `DrizzleRetrievalService` is the one wired (`chat.module.ts:27`). The stub is unused. Remove it + fix the comment. | `nestjs/src/rag/retrieval.service.ts:6,11-14` | Trivial (cleanup) |
| E2 | 🆕🔴 **Stale comment:** `DatabaseModule` doc says "Not yet imported by AppModule" but it's now imported by `rank.module.ts:16` + `github.module.ts:29`. Update the comment. | `nestjs/src/database/database.module.ts:12-13` | Trivial (cleanup) |
| E3 | 🆕🔴 **T4 memory-model gap:** no `DONE.md` ship log and no `Obsidian-Fastwork/Home.md` vault index exist, though the `t4-agent-memory` model expects both (the ledger is the only open-work file). Not a product task, but future agents inherit less history than the model assumes. Decide: adopt them, or record that this repo intentionally uses ledger-only + personal memory. | repo root / vault | Low (process) |

---

## Count

- **13 primary open items** — A(4) + B(1, = 16 issues) + C(4) + D(2). *(Note: C is now 4 with the hermetic-test item C4; the earlier verbal count of 3 folded C4 into C-general.)*
- **+3 newly surfaced** (E1–E3).
- **Total distinct work items: 16** (of which 6 have open GitHub issues; 10 are MD/code-only 🔴).

## Recommended order

1. **A1 (#36)** — real bug, small blast radius, TDD-able. Start with `debug-mantra`.
2. **E1 + E2** — trivial dead-code / comment cleanup (bundle into any nestjs touch).
3. **B1** — close the 16 shipped issues with evidence (needs user go — outward-facing).
4. **C2 / C3 / C4** — tech-debt, no prod risk.
5. **C1** — prod RLS: file an issue + write policies, apply behind full `/security-review`.
6. **A2 / A3 / A4** — large features; each needs its own grill → PRD → issues before code.
7. **D1 / D2** — hand back to the developer (dashboard/env actions).
