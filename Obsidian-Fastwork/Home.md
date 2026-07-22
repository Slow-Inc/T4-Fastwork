---
name: Home
tags:
  - moc
  - engineering
description: Map of Content for the shared T4 Fastwork cross-agent engineering knowledge base.
source: T4 Fastwork engineering knowledge
---

# T4 Fastwork Agent Knowledge Base

Shared engineering memory for developers and agents. This directory is committed so every client
and clone starts from the same durable principles.

## How Agents Use This Vault

1. Read this `Home.md` at the start of every session after `CLAUDE.md` and
   `docs/OPEN-WORK-LEDGER.md`.
2. Open [[Engineering North Star]].
3. Open only the index and topic notes relevant to the active task; do not load the entire graph.
4. Read the relevant requirement, ADR, spec, runbook, and live code before changing a domain area.
5. Add durable cross-task lessons as one concept per note and link them from the correct index.

Direct user instructions and `CLAUDE.md` take precedence. Live code/schema/configuration establish
current behavior; this vault captures reusable reasoning and operating knowledge.

## Core Principle

- [[Engineering North Star]] — simplest correct logic, maintainable long-term, with measured
  performance and surgical changes.

## Knowledge Maps

- [[Engineering Knowledge Index]] — compact entry point to every reusable engineering map.
- [[Architecture Principles Index]] — boundaries, refactoring, caching, external systems, and
  deployment architecture.
- [[Delivery and Quality Index]] — TDD, evidence, layered verification, post-mortems, and change
  records.
- [[Knowledge Management Index]] — truth hierarchy, ADR lifecycle, vocabulary, surveys, and
  handoffs.
- [[Security and Reliability Index]] — diagnosis, trust boundaries, authorization, privacy,
  destructive operations, and cancellation.
- [[Operations and Performance Index]] — runtime lifecycle, readiness, retries, observability,
  releases, recovery, and measured performance.
- [[Knowledge Migration Ledger]] — provenance and transfer decisions from the complete MangaDock
  Markdown survey.

## Canonical Repository References

- Open work: `docs/OPEN-WORK-LEDGER.md`
- Requirements: `Requirement.MD`
- Architecture decisions: `docs/adr/README.md`
- Domain-document routing: `docs/agents/domain.md`
- Issue workflow: `docs/agents/issue-tracker.md`
- Triage vocabulary: `docs/agents/triage-labels.md`
- Next.js version-specific docs: `nextjs/node_modules/next/dist/docs/`

## Definition of Done for Knowledge

- The note states one durable principle, its mechanism, and its limits.
- Source/provenance is recorded without copying MangaDock-specific configuration into T4.
- Conflicts with a T4 ADR are surfaced explicitly, never silently imported.
- All wikilinks resolve and the note is reachable from this Home graph.
- Repository instructions and canonical documentation are updated when the knowledge changes agent
  behavior.
