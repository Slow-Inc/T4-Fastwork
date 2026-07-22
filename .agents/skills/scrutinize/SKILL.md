---
name: scrutinize
description: Outsider-perspective end-to-end review of a plan, PR, or code change. First questions intent and whether a simpler/more elegant approach would achieve the same goal, then traces the actual code path (not just the diff) to verify the change does what it claims. Output is concise, actionable, and every call carries its rationale. Trigger on /scrutinize and proactively whenever the user asks to review, audit, sanity-check, or get a second opinion on a plan, PR, diff, design doc, or proposed code change.
---

# Scrutinize

Stand outside the change and ask whether it should exist at all, then verify it actually does what it claims end-to-end.

## Operating stance

- **Outsider.** Forget who wrote it and why they think it's right. Read the artifact cold.
- **End-to-end, not diff-local.** The diff is the entry point, not the scope. Follow the call graph through real code paths.
- **Actionable, concise, with rationale.** Every finding states *what to change*, *why*, and *what evidence* led you there. No filler, no restating the diff back.

## Workflow

Run these in order. Do not skip ahead.

### 0. Establish the review target and security scope

- For a pull request or branch intended for merge, resolve the pull request and review the actual
  merge diff, not only the latest commit. Record the PR URL/number, base ref and SHA, head ref and
  SHA, and the reviewed commit SHA. Re-read the head SHA before publishing the verdict; if it
  changed, the prior review is stale and the new diff must be reviewed.
- Classify the diff before tracing it. Invoke the `security-review` skill when it touches any trust
  boundary, including authentication, authorization/RLS, admin or privileged writes, secrets,
  uploads, webhooks, untrusted input, external requests, or a privileged database client. If the
  classification is uncertain, run `security-review`. It supplements rather than replaces this
  end-to-end review.
- A plan, design, or local artifact may have no PR. Review and report it normally; do not create a
  placeholder PR solely to hold evidence.

### 1. Intent — what is this actually trying to do?

- State the goal in one sentence, in your own words. If you cannot, the artifact is underspecified — say so and stop.
- Ask: **is there a simpler, smaller, or more elegant way to achieve the same goal?** Consider:
  - Doing nothing (is the problem real / load-bearing?).
  - Using something that already exists in the codebase instead of adding new surface.
  - A smaller change that solves 90% of the goal with 10% of the risk.
  - Solving it at a different layer (config vs code, framework vs app, build vs runtime).
- If a better alternative exists, name it explicitly with rationale. This is the most valuable thing you can output — surface it before the line-by-line review.

### 2. Trace — walk the actual code path

- For each behavior the change claims, trace the path end-to-end through the real code, not just the lines in the diff:
  - Entry point → call sites → branches taken → state mutated → exit / return / side effect.
  - Include the unchanged code on either side of the diff. Bugs hide at the seams.
- For a plan or design doc: trace the proposed flow against the existing system. Where does it touch reality? What does it assume that isn't true?
- Note every place the trace surprises you (unexpected branch, dead code reached, state you didn't know existed). Surprises are signal.

### 3. Verify — does it actually do what it claims?

For each claim the change/plan makes, answer:

- **Does the code path you just traced actually produce that behavior?** Walk it explicitly. "It claims X. Path: A → B → C. At C, [observation]. Therefore [holds / doesn't hold]."
- **What inputs / states would break it?** Edge cases, concurrent callers, error paths, partial failures, retries, empty/null/unicode/huge inputs, ordering assumptions.
- **What does it silently change?** Performance, error semantics, observability, contract for other callers, on-disk / on-wire format.
- **How is it tested?** Do the tests actually exercise the traced path, or do they pass while skipping it (mocks that hide the bug, asserts on intermediate state, happy path only)?

### 4. Report

Output one tight section per finding. Order by severity (blocker → major → nit). For each:

- **Finding** — one sentence, specific. Cite `file:line` when applicable.
- **Why it matters** — the consequence, not the principle.
- **Evidence** — the trace step or input that exposes it.
- **Suggested change** — concrete, minimal.

Close with a one-line verdict: ship / fix-then-ship / rework / reject — with the single biggest reason.

#### PR evidence — mandatory for pull-request and pre-merge reviews

- Publish the complete review as a PR comment through the configured issue tracker. The comment
  must contain a full English report and a full Thai mirror with the same scope, findings,
  evidence, suggested changes, verification, security status, and verdict. A translated summary
  is not sufficient.
- Identify the reviewed PR, base/head refs and SHAs, and reviewed commit SHA in the comment so the
  evidence cannot be reused after the code changes.
- Include a `Security review` section. When security-sensitive, run `security-review` and mirror its
  findings, remediations, tests, and residual risks in both languages. When it is not required,
  state that with the concrete classification rationale in both languages.
- Confirm that the comment exists and capture its comment URL (or stable comment ID). If posting
  fails, do not mark `scrutinize` complete and do not recommend merge.
- If findings are fixed or HEAD changes, review the updated actual merge diff and post a new
  bilingual follow-up comment tied to the new reviewed commit. Never treat a stale comment as the
  current merge gate.

Use this minimum PR-comment shape (expand each finding using the report rules above):

```md
## Scrutinize review evidence

PR: <url> · Base: <ref@sha> · Head/reviewed commit: <ref@sha>

### English
- Intent and simpler alternative: ...
- Traced paths: ...
- Findings and suggested changes: ...
- Verification: ...
- Security review: <required/not required, evidence and residual risks>
- Verdict: ...

### ไทย
- เป้าหมายและทางเลือกที่ง่ายกว่า: ...
- เส้นทางที่ตรวจ: ...
- Findings และข้อเสนอแก้ไข: ...
- การยืนยันผล: ...
- Security review: <จำเป็น/ไม่จำเป็น หลักฐานและความเสี่ยงคงเหลือ>
- Verdict: ...
```

## Operating rules

- **No rubber-stamps.** "LGTM" is not an output. If you genuinely find nothing, say what you traced and what you checked, so the user can judge whether your review covered the surface they cared about.
- **Cite or it didn't happen.** Every claim about the code references a specific path, file, or line. No vague "this might break under load."
- **Distinguish claim from verification.** "The PR says X" and "I traced X and confirmed / refuted it" are different — keep them separate in the output.
- **One simpler-alternative pass is mandatory.** Even on small changes, spend one breath asking if the whole thing is necessary. Skip only if the user explicitly says "don't question scope."
- **Don't pad with style nits when there's a structural problem.** If step 1 or step 2 surfaces a real issue, lead with it; defer nits or drop them.
- **No flattery, no hedging.** "This is a great PR but..." adds nothing. State the finding.
