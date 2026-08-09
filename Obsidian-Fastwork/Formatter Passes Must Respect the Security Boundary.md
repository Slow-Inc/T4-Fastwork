---
name: Formatter Passes Must Respect the Security Boundary
tags:
  - engineering
  - formatting
  - security
description: Running prettier from the wrong cwd silently reformatted a security-boundary file — .prettierignore paths are relative to the ignore file, and the AFK boundary rule is why this matters.
---

# Formatter Passes Must Respect the Security Boundary

## The one-line rule

Run repository-wide formatting only from the repository root, and never let a mechanical formatter touch a
security-boundary file without a human review.

## What happened (2026-08-09, #280)

The `format` pass for the formatting-debt PR excluded `nestjs/src/security/turnstile.verifier.ts` via
`.prettierignore` (a deliberate AFK boundary decision — a boundary file is not reformatted unattended).
Yet the file **was** reformatted during the session. Observed: running the formatting pass from `nestjs/`
instead of the repository root produced a reformat of the boundary file (reverted, then verified the
pass from the root leaves it byte-identical to HEAD). The mechanism is inferred, not controlled:
`.prettierignore` patterns are **relative to the directory of the `.prettierignore` file** (the repo
root), so an entry `src/security/turnstile.verifier.ts` matches `<root>/src/security/…`, which does not
exist — the real path is `<root>/nestjs/src/security/…` — and running from a different cwd shifts both
the glob and the ignore resolution. Whatever the precise trigger, the prevention below removes the
failure class.

## The prevention rule

1. List **both** path forms in `.prettierignore` (`src/security/…` and `nestjs/src/security/…`) so the
   exclusion holds regardless of cwd.
2. Always run formatting scripts from the root (`bun run format` at the repo root), never from inside a
   workspace.
3. After any formatting pass, verify the boundary file is byte-identical to HEAD
   (`git diff` on it is empty) before committing — that is the check, not the config.

## Why it matters

The AFK operating rule is "a security-boundary file is never touched unattended — the reviewer who
confirms a reformat is behavior-preserving is exactly who AFK removes." A formatter that quietly edits a
boundary file defeats that rule without anyone noticing. The `.prettierignore`/eslint carve-out is
documented in `nestjs/eslint.config.mjs` (the `prettier/prettier` rule is off for the boundary file so
the lint check stays green with it unformatted).

## Verification method

`git diff --name-only` on the pass must not list the boundary file; `git diff` on it must be empty. This
is asserted for the exclusion in `nestjs/test/lint-is-check-not-mutation.spec.ts` and was manually
verified during #280.

Related: [[Unfixed Vulnerabilities Stay Out of a Public Repo]], [[Engineering North Star]].
