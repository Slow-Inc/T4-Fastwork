# ADR 0010 — Map-reduce extract cache lives in a single `project_documents.extract jsonb` column

**Status**: Accepted · 2026-07-18
**Relates to**: implements [ADR 0009](0009-github-sourced-ai-authored-case-studies.md) **D2** (the
blob-SHA-keyed extract cache) · schema foundation is [migration 0020](../../supabase/migrations/0020_p1_case_study_schema.sql) (#64) · this column is [migration 0022](../../supabase/migrations/0022_project_documents_extract_cache.sql) (#81, PR #101)

## Context

ADR 0009 D2 makes 100%-automation cheap by caching each file's Stage-1 **map extract** keyed by its
`blob_sha`, so an unchanged file is never re-mapped by the LLM: *"Cache each extract keyed by
`blob_sha` … persist the returned extracts back to `project_documents`."* But the P1 schema
(migration 0020) gave `project_documents` **no column to hold an extract** — it stores only the raw
manifest (`blob_sha`, `content_hash`, `markdown`, `last_seen_commit`, `deleted_at`). D2 names the
cache's *location* (`project_documents`) but not its *shape*. Implementing #81 forced that choice;
ADR 0009 does not decide it, and it is hard to reverse once extracts are written — hence this ADR.

The cached unit is a `FileExtract` (`nestjs/src/github/github-case-study.ts`):
`{ path, blobSha, themes[], architecture, tech[], userOutcomes, codeDepth }`.

## Decision

Add a single **nullable `extract jsonb`** column to `project_documents` (migration 0022) and store the
**whole `FileExtract`** — including the `blobSha` it was mapped *from* — in it.

- **Freshness is decided by the stored `blobSha`, not the row's.** `selectDocsToMap` reuses a cached
  extract iff `stored.blobSha === current row blob_sha`. The worker updates a changed file's row
  `blob_sha` *before* generation, so a stale extract (mapped from the old sha) no longer matches and
  is re-mapped. This is why the extract carries its own `blobSha` rather than relying on the row's.
- **Read-time validation.** A stored blob is reused only if it is a well-formed `FileExtract`
  (`isFileExtract` checks every field); a partial/corrupt blob is dropped → the file is re-mapped,
  never fed downstream as a valid extract.
- **`null` means "not yet mapped / re-map it."** Additive + nullable, so existing rows are unaffected.

## Consequences

- Reversible for now: additive nullable column, and no `source='github'` project has data yet
  (P2 is inert until the #66 worker populates `project_documents`) — a rollback is `drop column`.
- `jsonb` is schemaless, so an extract-shape change needs no migration; correctness is kept by (a)
  the read-time `isFileExtract` guard and (b) `PROMPT_VERSION` being part of the manifest hash (ADR
  0009 D3), so a shape/prompt change bumps the version → the whole project regenerates rather than
  reusing extracts of the old shape.
- One column, one row per document (strict 1:1) — no join, no second table to keep in sync.

## Alternatives considered

- **Separate typed columns** (`themes text[]`, `architecture text`, …) on `project_documents` —
  rejected: rigid (every extract-shape change is a migration), and it spreads one logical value
  across many columns for no query benefit (the cache is only ever read/written whole).
- **A separate `project_document_extracts` table** keyed by `(project_id, path, blob_sha)` — rejected:
  an extra table + join for a strict 1:1 with the document row, with no lifecycle of its own (an
  extract dies with its document). The column is simpler.
- **Store only the extract body and reconstruct `path`/`blobSha` from the row** — rejected: the
  stored `blobSha` must be the sha the extract was *mapped from* (for the freshness check); after a
  content change the row's `blob_sha` is the *new* sha, so reconstructing from the row would make a
  stale extract look fresh and wrongly skip the re-map.
