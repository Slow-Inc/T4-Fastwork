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

## "Recording the rationale" is not the same as being allowed to skip (#211, 2026-07-25)

The paragraph above permits recording a rationale when a diff is not security-sensitive. That is a
narrow allowance and it was over-read: on PR #214 the gate was declared inapplicable in the evidence
comment without `security-review` being invoked at all — while the diff **changed the response body
of two secret-guarded endpoints** and added a new public document. Both are named triggers. The
developer asked "did you actually run it", which is the only reason it got run.

Two rules follow.

**Classify by what the diff touches, not by what it is about.** "This is only observability" and
"this is test-only" describe intent; the trigger list describes surface. A field added to the
response of an endpoint behind a shared secret is an exposure question (*could an unpublished slug
reach a caller?* — the answer required reading two candidate queries, not judgement), and a new
committed document is a secret-disclosure question.

**Re-invoke the judgement skills per artifact, not per session.** Applying a skill's workflow from
memory because it was loaded earlier for a different PR is how a pass gets shallower without anyone
noticing. Re-invoking `scrutinize` on the same HEAD, as an outsider, found a defect the first pass
missed: a warn message asserting `no README on GitHub` when the reader only consults the snapshot
store (`nestjs/src/github/github-read.service.ts:52`), so a repo whose sync had not run yet would be
reported as missing a README it has. An observability signal whose text overclaims is worse than the
silence it replaced. See [[Degraded Modes Must Be Observable]].
