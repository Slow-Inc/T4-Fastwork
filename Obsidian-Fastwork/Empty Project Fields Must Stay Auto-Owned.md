---
name: Empty Project Fields Must Stay Auto-Owned
tags:
  - enrichment
  - ownership
  - github
description: Schema default human on empty AI-fillable project owners blocks all enrichment generators.
source: Project Enrichment Audit 2026-07-24 · issues #167–#170
---

# Empty Project Fields Must Stay Auto-Owned

## Symptom

Published projects (e.g. Hype-Macro_Store) showed empty category, technologies, tags, and deep content after epic #156 generators shipped. Nest dry-run for `generate-taxonomy` returned `candidates: 0`.

## Verified cause

Postgres column defaults for `category_owner`, `tags_owner`, `technologies_owner`, and `content_owner` were `'human'`. Bulk/org imports that omit those columns inherit the default. Owner-guarded SQL correctly skips `human` rows — so empty fields stay empty forever.

Curate draft inserts already pass `'auto'`; the poison path is **unspecified columns → DB default human**. `overview_owner` already defaults to `'auto'` and overview fill worked (15/47).

## Prevention

1. Empty AI-fillable fields must be `*_owner = auto` until a human edits them.
2. One-time remediation: flip `human` → `auto` **only where the field is still empty** (issue #168).
3. Change schema defaults to `'auto'` for those four columns (issue #170) so new imports cannot re-poison.
4. Never flip owner on rows that already have human-filled values (e.g. MangaDock).

## Verification

After #168: taxonomy `candidates: 46`. After five capped applies: Hype-Macro_Store gained category + 17 techs + 6 tags + content. Revalidate `/projects/hype-macro-store`.
