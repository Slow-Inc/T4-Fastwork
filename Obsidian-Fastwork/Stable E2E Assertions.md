---
tags:
  - testing
  - e2e
  - reliability
description: Keep feature E2E assertions anchored to stable data owned by the behavior under test.
source: Project-detail tabs D2 (#129), 2026-07-23
---

# Stable E2E Assertions

## Symptom

The project-detail tabs E2E reached the technology panel correctly but failed
when it asserted the optional GitHub language snapshot. Switching projects then
failed on an empty deep-detail dataset. Both failures obscured the tab behavior
the test was intended to verify.

## Verified cause

Project content and GitHub language snapshots are independently populated,
fail-soft data. Their availability varies by project and refresh progress, while
the tab labels, selection state, focus movement, and technology heading are
owned by the D2 UI itself.

## Prevention rule

Assert a feature's interaction contract using stable fields owned by that
feature. Cover optional live overlays in their own integration test with an
explicitly prepared fixture or availability precondition; do not make an
unrelated interaction test depend on refresh convergence.

## Verification

The D2 test uses MangaDock's populated deep-detail content and the stable
technology heading, then verifies click selection and ArrowRight focus. The
targeted test passed, followed by the complete Chromium suite (59/59).

## Corollary — an assertion must not depend on a matcher's leniency (#175, 2026-07-25)

Playwright's `hasText` with a **string** is a case-insensitive *substring* match. A listing
assertion compared a category read from the detail page against the card's badge and passed —
but only because of that leniency: `.badge` is `text-transform: uppercase`
(`nextjs/app/globals.css:1227`) while the detail eyebrow `.t-idx` is not (`:94`), so the same
stored value renders in two cases. The assertion was therefore load-bearing on undocumented
matcher behavior, and being a *substring* match it would also accept a different badge on the
same card. **Rule:** when two surfaces render the same stored value, state the normalisation
explicitly (compare full texts case-folded) and cite the transform — do not let the matcher's
tolerance be the reason the test passes.

Related: `.rv` reveal styling is `opacity: 0` + `transform` only (`:959`), never `display:none`
or `visibility:hidden`, so Playwright's visibility check is *not* gated on scroll reveal. Verify
that by reading the rule rather than assuming it — the opposite choice would make every
below-the-fold `toBeVisible()` flaky.

## Corollary — a data assertion needs a real negative control

A test that claims "the page shows generated content" is unproven until it has been seen to fail
on a page that does not. Prefer a production row that genuinely lacks the data over mutating a
source file: it proves the assertion against the real render path, needs no revert, and does not
depend on whether the server under test is a dev or a production build. #175 used
`/projects/t4-fastwork` — published, github-sourced, `category_id` and `content` both null — which
failed on `<div class="t-idx"></div>`. Finding such a row is itself a defect report ([[#211]]),
not just test scaffolding. See [[Evidence Before Completion]].
