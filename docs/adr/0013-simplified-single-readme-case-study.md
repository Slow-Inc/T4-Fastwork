# ADR 0013 — Simplified single-README case study generation

**Status**: Accepted
**Date**: 2026-07-23
**Relates to**: [ADR 0009](0009-github-sourced-ai-authored-case-studies.md) · [ADR 0010](0010-case-study-extract-cache-column.md) · [ADR 0011](0011-auto-publish-public-repos-visibility-is-authorization.md)

**Supersedes**: ADR 0009 D2 (map-reduce), D3 (GitHub App + webhook worker + per-file manifest),
and D4 (immutable revisions + overrides); marks ADR 0010 (extract-cache column) as unused by the
runtime.

## Context

The full ADR 0009 pipeline is dormant and introduces GitHub App credentials, a repository tree
walk, per-file manifests, extract caching, three audience variants, revision tables, and worker
state for a four-to-five-person agency site. The existing single-README generation path already
has the necessary prompt delimiting, taxonomy validation, persistence seam, and `readme_sha`
delta gate.

## Decision

Generate one canonical bilingual, README-grounded case study per published GitHub-backed project
on the existing hourly refresh cron. Reuse the existing `github-generate` path and make one
guarded LLM call per changed README. Publish the result in one transaction by upserting a
`blog_posts` row with `kind = 'case_study'` and `source = 'github'`, mirroring the narrative into
`projects.content` for existing RAG/chat grounding, and advancing `readme_sha` last. An unchanged
README SHA makes zero LLM calls. A generated post edited by an admin is claimed by `owner =
'human'` and is not overwritten by the cron.

This deliberately accepts hourly freshness, thinner copy for README-poor repositories, no
generated revision history, and one broadly useful narrative instead of three audience variants.

## Explicitly skipped

- GitHub App and installation tokens.
- Personal-account push webhooks.
- Repository tree-walk and `project_documents` as a runtime prerequisite.
- Per-file blob-SHA extract cache.
- Map-reduce and hierarchical reduce.
- Three audience variants, audience switcher UI, and per-audience URLs.
- `blog_post_revisions` and `blog_post_overrides`.
- Durable queues, workers, and retry state machines.
- A separate blog RAG source type and `chunkBlog`.
- Immediate destructive removal of the pipeline tables.
- Realtime team-page invalidation.

## Consequences

- The existing generator becomes a small, buildable end-to-end path with bounded LLM cost.
- Public case studies can lag a README change by up to one hourly cron interval.
- The old map-reduce runtime and extract column are retained only as non-destructive dormant
  schema/code until a later retirement ticket.
- Prompt injection delimiting, output validation, last-known-good preservation, and the
  public-repository authorization decision remain in force.
