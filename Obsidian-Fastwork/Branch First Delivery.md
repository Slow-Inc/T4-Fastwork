---
tags:
  - delivery
  - git
  - pull-request
description: Start every repository change on a feature branch and deliver code and records through a PR.
source: Developer correction during project-detail D5 (#132), 2026-07-23
---

# Branch First Delivery

## Symptom

A docs-only open-work ledger update was pushed directly to `master` after a
feature merge.

## Verified cause

A historical handoff note saying that direct docs-only pushes had worked was
treated as workflow authorization. That conflicted with the repository's
branch-and-PR delivery gate and the developer's explicit rule that `main` /
`master` must not receive direct pushes.

## Prevention rule

Before the first mutation for any repository task, create or switch to the
task's feature branch. Deliver every scoped change—including documentation,
ledger, and learning records—through the issue-linked PR. Treat historical
examples as context, not permission to bypass the current workflow.

## Verification

For D5 #132, `feat/project-detail-chat` was created while the worktree still
contained no D5 changes. The red E2E test, implementation, ledger update, and
this learning record all remain on that branch for PR review.
