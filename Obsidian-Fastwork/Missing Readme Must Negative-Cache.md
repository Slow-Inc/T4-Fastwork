---
name: Missing Readme Must Negative-Cache
tags:
  - github
  - enrichment
  - bug
description: A 404 or failed README detail sync must write a durable snapshot key or the missing-readme queue stalls forever.
source: T4 Fastwork #177 / epic #172
---

# Missing README Must Negative-Cache

## Symptom

`POST /github/refresh/missing-readme` kept reporting `synced: 1` / `candidates: 26` while the same repo (e.g. `narze`) was selected every run. Taxonomy and case-study stays at `generated: 0` for those rows.

## Cause

`GithubDetailService.syncRepoDetail` tolerated GitHub README **404** without writing `repo:owner/repo:readme`. The controller still counted the run as synced. Selection uses `listExistingReadmeKeys`, so the candidate never left the queue. Hard sync failures (gone/private repos) had the same stall.

## Fix

- On README 404, write `{ markdown: '', sha: 'missing' }`.
- On detail sync failure, `markReadmeAbsent` writes the same sentinel.
- Generators use `isUsableReadmeSnapshot` and skip the sentinel (0 LLM).

## Verification

Unit tests in `github-detail.service.spec.ts` + `missing-readme-*.spec.ts`. Ops: missing-readme candidates drained 26→0 after the fix.
