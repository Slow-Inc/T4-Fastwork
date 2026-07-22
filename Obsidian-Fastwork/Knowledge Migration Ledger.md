---
tags:
  - knowledge
  - migration
  - ledger
description: Tracks which MangaDock knowledge areas were reviewed, migrated, rejected, or remain for later extraction into T4 Fastwork.
source: Created for the MangaDock to T4 Fastwork knowledge migration on 2026-07-22
---

# Knowledge Migration Ledger

## Reviewed and Extracted

- `CLAUDE.md` / `AGENTS.md`: Engineering North Star, surgical changes, verification, diagnosis, reversibility
- `Obsidian-MangaDock/feedback-*`: seams, characterization-first refactoring, evidence, experiments, impact records, living docs
- `docs/agents/workflow.md`: problem-to-PRD/issues/TDD/verification flow
- `docs/reports/post-mortem-template.md`: validated blameless postmortems
- `docs/adr/README.md`: ADR lifecycle and supersession
- `docs/agents/domain.md` + `UBIQUITOUS_LANGUAGE.md`: canonical domain vocabulary
- `docs/reports/README.md` + documentation indexes: truth hierarchy and document lifecycle
- `docs/reports/survey-manifest/README.md`: incremental survey provenance
- ADR 011–016, 020–021: cache correctness, scoped resets, integration boundaries, auth cache isolation, trust validation, dead architecture, ephemeral compute
- All 20 project-owned ADRs: constraint revalidation, identity defaults, contract-preserving transforms, state lifetime, resource gates, lifecycle, and cross-service contracts
- All 12 plans/specs: atomic transitions, idempotent events, transaction authority, SSE lifecycle, migration safety, and progressive UX
- All 25 reports: retry/DLQ, layered invalidation, hot-path cost, release truth, SLOs, runbooks, recovery drills, and documentation effects
- All 16 component documents and design critiques: liveness/readiness, protocol boundaries, cancellation, compatibility, accessibility, and error recovery
- All 12 research documents: baseline discipline, mechanism-level measurement, provenance, explicit unknowns, and upstream divergence
- All 20 academic/system documents: requirements-to-UAT traceability, deployment evidence, risk records, and historical-document labeling
- Root, runbook, workflow, and existing knowledge-vault Markdown: canonical vocabulary, bounded bootstrap, issue truth, and durable agent memory

The file-level evidence is in [[MangaDock Markdown Survey Manifest]]: **160 project-owned Markdown files / 28,301 lines / 12 categories**, each recorded with SHA-256 for incremental rescans.

## Reviewed but Deliberately Not Copied

- Manga translation endpoint/cache-reset instructions: domain-specific
- MangaDock issue ownership and automatic merge policy: team/repository-specific
- MangaDock service-role authorization decision: conflicts with T4 Fastwork ADR 0007; only its failure-mode lesson was retained in [[Authorization Needs a Backstop]]
- Provider URLs, ports, secrets, deployment vendors and cost assumptions: environment-specific and temporally unstable
- Manga render/ML algorithms and benchmark pages: unrelated to T4 product behavior
- Academic deliverable wording, diagrams, and historical system descriptions: retained only as traceability/UAT/deployment lessons, not as current T4 architecture
- Branch names, issue numbers, model choices, GPU limits, endpoint paths, and reconciliation steps: snapshots of MangaDock operations, not portable policy
- Qwen-specific delegation commands and tool permissions: model/client-specific and not a standing T4 rule
- Duplicate bilingual mirrors and generated/reference indexes: useful evidence, but copying them would create competing sources of truth

## Extracted in the Complete Pass

- [[Atomic State Transitions and TOCTOU]] and [[Idempotent Event Processing]]
- [[Retry Taxonomy and Dead Letters]], [[Liveness Readiness and Startup Gates]], and [[Async Cleanup and Idempotent Shutdown]]
- [[Explicit State Lifetimes]], [[Degraded Modes Must Be Observable]], and [[Cross-Service Contract Compatibility]]
- [[Contract-Preserving Transformations]], [[Identity Defaults and Safe Rollouts]], and [[Resource-Specific Concurrency Gates]]
- [[Measure Performance at the Mechanism]] and [[Baselines Before Optimization]]
- [[Constraint Revalidation and Decision Reversal]] and [[Idempotent Data Migrations]]
- [[Release Truth and Rollback Drills]] and [[SLOs Runbooks and Recovery Drills]]
- [[User Acceptance Is a Separate Gate]], [[Reference Comparison with Provenance]], and [[Documentation Can Affect Runtime]]

Future rescans should hash the same allow-listed paths and review only additions or changed hashes. Prefer one durable principle per note; never copy MangaDock-specific configuration into T4.

Related: [[Incremental Survey Manifests]] · [[Documentation Truth Hierarchy]] · [[Home]]
