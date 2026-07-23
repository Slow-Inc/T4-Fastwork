---
name: Targeted GitHub Snapshot Repairs
tags:
  - operations
  - github
  - supabase
  - vercel
description: Safe verification and recovery rules for repairing one project's GitHub binding and detail snapshots.
source: MangaDock production repair on 2026-07-23
---

# Targeted GitHub Snapshot Repairs

## Symptom

A published project can have no language donut, README, or contributor overlay even when its
GitHub repository exists. The public project row may be missing `gh_owner` / `gh_repo`, so the
Next.js detail route never asks the GitHub snapshot API for that repository.

## Verified causes and constraints

- MangaDock was the only one of 47 published projects with both GitHub binding fields null. Its
  verified repository is `Slow-Inc/MangaDock`.
- The repository migration chain could not bootstrap a fresh local Supabase stack: the first
  migration attempted to alter `public.certificates` before a baseline table existed. Do not repair
  or reorder unrelated migrations during a one-row data operation.
- `POST /github/refresh` performs broad sequential org, member, profile, and published-project
  work. On Vercel it exceeded the 60-second function window and returned
  `FUNCTION_INVOCATION_TIMEOUT`.
- A function timeout does not imply rollback. MangaDock's languages, contributors, pulls, and
  README snapshots had already persisted before the timeout.

## Prevention and recovery rule

1. Confirm the repository from GitHub and read the exact production project row.
2. Verify conditional SQL on localhost. If the full local Supabase migration chain is broken,
   use a disposable local Postgres table matching only the touched columns; do not change the
   migration chain as a side quest.
3. Make the production update narrow and conditional on the previously observed state.
4. If a broad refresh times out, do not retry blindly. Read the repo-detail snapshot endpoint and
   inspect each partial side effect first.
5. Revalidate only the affected public project path after binding/snapshot data is ready.
6. Prefer the targeted repo-detail refresh proposed in
   [#143](https://github.com/Slow-Inc/T4-Fastwork/issues/143) for future one-repository repairs.

## Verification method

- Public project read returns the expected `gh_owner` and `gh_repo`.
- `GET /github/repos/<owner>/<repo>/detail` contains non-null languages, contributors, pulls, and
  README data.
- The production project HTML contains the language donut, a visible language name, the GitHub
  repository link, and the immediately visible AI composer.
- Disposable local containers are stopped and removed after verification.
