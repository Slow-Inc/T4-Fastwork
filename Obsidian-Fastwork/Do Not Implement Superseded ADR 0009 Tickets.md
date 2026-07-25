---
name: Do Not Implement Superseded ADR 0009 Tickets
tags:
  - delivery
  - adr
  - tracker
description: Closed ADR 0009 pipeline tickets must not be reopened or implemented; use ADR 0013 and residual #69/#75 instead.
source: 2026-07-24 tracker reconciliation
---

# Do Not Implement Superseded ADR 0009 Tickets

## Rule

If an open or recently closed issue still describes the **full ADR 0009** pipeline (GitHub App,
per-file manifest worker, map-reduce, three audiences, `chunkBlog`, immutable
`blog_post_revisions` / overrides), **do not build it**. Prefer [ADR 0013](../docs/adr/0013-simplified-single-readme-case-study.md)
and the current `ready-for-agent` queue.

## Closed on purpose (2026-07-24)

| Issue | Disposition |
|-------|-------------|
| #62 | Epic closed — superseded by ADR 0013 |
| #66 #67 #68 #70 #81 | Closed `not planned` / `wontfix` — fix-plan Wave 4 T4.1 list |
| #71 #92 | Closed `completed` — delivered under #127 / revalidate wiring |

## Still valid residuals

- **#69** — Nest service chat-card labels (+ optional static-seed delete after parity only).
- **#75** — `/github/generate` `apply:true` must persist the reviewed patch (no second LLM call).

## Why this exists

Agents previously treated `ready-for-human` ADR 0009 children as future work after ADR 0013
shipped. That reintroduces over-engineering the fix plan explicitly dropped for a 4–5 person
agency site.

## Related

- [[Documentation Truth Hierarchy]]
- [[Constraint Revalidation and Decision Reversal]]
- [[ADR Lifecycle and Supersession]]
