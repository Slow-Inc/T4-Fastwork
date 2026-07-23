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
