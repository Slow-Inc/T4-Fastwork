---
tags:
  - delivery
  - review
  - evidence
description: A pre-merge review is complete only when its exact diff and bilingual evidence are recorded on the PR.
source: User correction and validated Wave 0+1 review-history audit, 2026-07-23
---

# Bilingual Pre-Merge Review Evidence

A review performed only in an agent session is not durable merge evidence. For every PR or branch
intended for merge, run `code-review` and `scrutinize` against the actual merge diff and post the
complete result as a PR comment in English with a full Thai mirror.

The comment records the PR, base/head refs and SHAs, reviewed commit, traced paths, findings,
verification, and verdict. Capture the comment URL. A later HEAD invalidates the evidence and
requires a new review and follow-up comment.

Classify the diff for trust-boundary risk before the verdict. Auth, authorization/RLS, admin or
privileged writes, secrets, uploads, webhooks, untrusted input, external requests, and privileged
database clients require `security-review`. Include its findings, remediations, tests, and residual
risks in the same bilingual evidence. If the diff is not security-sensitive, record the concrete
rationale instead of silently omitting the gate.

The Wave 0+1 history demonstrated the failure mode: a useful `scrutinize` run found a destructive
seed defect, but review evidence was only summarized in the PR body and the companion `code-review`
was not evidenced. Durable, commit-bound PR comments make both the performed review and any stale
review visible before merge.
