---
name: Frontend Needs Suite And Browser Smoke
tags:
  - delivery-quality
  - frontend
  - e2e
  - verification
description: Every frontend change must pass bun run e2e and an interactive real-browser smoke before completion.
source: Operator rule 2026-07-24 — CLAUDE.md / AGENTS.md
---

# Frontend Needs Suite And Browser Smoke

## Rule

For any Next.js / UI change, completion requires **both**:

1. **`bun run e2e`** in `nextjs/` — full Playwright Chromium suite (layout, hydration, nav overlap, locale).
2. **Real-browser smoke** — Cursor browser MCP (or equivalent interactive Chromium) against the
   **current** build (`localhost:3000` or the relevant preview/prod URL). Open the touched routes;
   confirm primary content (`<h1>` / main UI), no obvious navbar overlap or blank collapse, and that
   the changed interaction still works. Note routes checked on the PR/issue when non-trivial.

`bun run e2e` alone is **not** enough. Browser smoke alone is **not** enough.

Skip both only when the change has no Next/UI surface (Nest-only, pure docs, SQL-only). Nest
`supertest` e2e does not replace these gates.

## Why

Happy-dom unit tests miss layout/hydration. Playwright catches regressions at suite scale but can
still miss data emptiness, visual enrichment gaps, or “looks broken to a human” issues on a live
session. The dual gate closes that gap.

## Related

[[Layered Verification]] · [[Frontend Verification Must Use the Current Build]] ·
[[Evidence Before Completion]] · `CLAUDE.md` (Commands ⚠️ note)
