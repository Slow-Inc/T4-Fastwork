---
name: t4-engineering-records
description: Use when working in T4 Fastwork and something notable happened that a future agent needs the why of, including a validated bugfix, hard-to-reverse decision, system-affecting change, wrong assumption, user correction, avoidable rework, regression, or reusable prevention rule. Choose the correct durable record and keep it validated, findable, and linked.
---

# T4 Engineering Records

## Overview

In an agent-primary repo, the record you write *is* the memory the next agent inherits — it can't ask you later. A record has value only if it is **findable, grounded, and true**: code identifiers (`file:line`, function names, commit SHAs) are the index that lets the next agent grep back to the actual change, and an unverified record is worse than none because it looks authoritative while being wrong.

This skill answers two questions: **which record** to write, and **how** to write it so it stays reliable.

## Which record — decide first

| What just happened | Record | Home |
|---|---|---|
| A bug is **fixed and validated** (reliable repro + known root cause + validated fix) | **post-mortem** | `docs/reports/YYYY-MM-DD-<slug>.md` + a pointer in the impact register |
| A significant, **hard-to-reverse decision** — or a **quality / performance decision** whose rationale or benchmark would otherwise be lost — was made (already in the code, or explicitly planned) | **ADR** | `docs/adr/NNNN-<kebab>.md` + a row in `docs/adr/README.md` |
| Any **system-affecting change** shipped (feature, refactor, security, hotfix) | **canonical docs + work-state reconciliation** | update the affected requirement/runbook/ADR and reconcile `docs/OPEN-WORK-LEDGER.md` |
| A notable bug whose **transferable lesson** is worth keeping | **one durable knowledge note** | add/update one note in `Obsidian-Fastwork/` and link it from the relevant index |

Guards:
- **Learning capture is mandatory when triggered.** Before completion, record a wrong assumption,
  user correction, regression/rework, non-obvious failure, or reusable prevention rule in an
  existing vault note or one new focused note linked from its index.
- **Don't post-mortem a hypothesis.** If the repro isn't reliable, the root cause isn't known, or the fix isn't validated — you don't have a post-mortem yet. List what's missing and stop.
- **A feature/refactor is not a post-mortem** — it's a system-impact entry (+ an ADR if it encodes a decision).
- **A trivial one-liner needs neither** — the PR description is enough.
- **One decision = one ADR.** Overturning a prior decision doesn't edit it — write a new ADR and mark the old one **Superseded by NNNN**. ADR numbers are globally unique across branches.

## How — the rules that keep records reliable

- **Keep code identifiers.** `file:line`, function/symbol names, the offending commit SHA. They are the index; prose without them can't be grepped back.
- **Validated-only, honest coverage.** State how you know it works (the failing test that now passes, the E2E that now succeeds, before→after numbers). If only one config was tested, say so. Never fabricate a number — write "not measured" / "N/A".
- **Blameless, active voice, no hedging.** Describe the gap, never the person. Drop "we believe" / "appears to" — prove it or cut it.
- **Ground ADR claims in the code as it is now**, and cite where. An ADR that describes an intention the code doesn't reflect is a landmine.
- **Leave a pointer, don't duplicate.** An ADR gets a row in the ADR README; a durable lesson gets
  one vault note linked from an index. Keep the full text in one canonical place and link to it
  from `docs/OPEN-WORK-LEDGER.md` only while work remains open.

## Templates

See `references/record-templates.md` for drop-in skeletons. In T4 Fastwork, use the post-mortem,
ADR, and ADR-index templates; use the shared vault for transferable lessons rather than creating
parallel system-impact or bug-catalog sources.

## Cross-skill

- Records are memory — follow `Obsidian-Fastwork/Documentation Truth Hierarchy.md` and the
  retrieval rules linked from `Obsidian-Fastwork/Home.md`.
- GitHub issue and PR bodies follow the bilingual rule in `CLAUDE.md`; repository records remain
  English unless the user explicitly requests otherwise.

## Common mistakes

- **Writing a post-mortem before the fix is validated.** That's a hypothesis; refuse until the repro passes.
- **Prose with no `file:line` / commit SHA.** Unindexable — the next agent can't get from your words to the code.
- **Editing an old ADR to reverse it** instead of superseding — erases the decision history.
- **Fabricated or implied-broader coverage.** "Tests pass" when you ran one config reads as full coverage; state the scope.
- **Duplicating the full record in two files** instead of full-text-in-one + pointer-in-the-other.
